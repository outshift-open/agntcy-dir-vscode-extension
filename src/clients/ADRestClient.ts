// Copyright © 2025 Cisco Systems, Inc. and its affiliates.
// All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import { Repository, Organization } from "./saasModels";
import { getConfigs } from "../config/readSession";

export class APIError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly responseBody: unknown,
    message?: string
  ) {
    super(message || `HTTP error! status: ${status} ${statusText}`);
    this.name = "APIError";
  }
}

interface GetRepositoriesResponse {
  paginatedResponse: {
    count: number;
    pages: number;
  }
  repositories: Repository[];
}

interface OrganizationResponse {
  organization: Organization;
  role: string;
}

interface GetOrganizationsResponse {
  paginatedResponse: {
    count: number;
    pages: number;
  }
  organizations: OrganizationResponse[];
}

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  withAuth?: boolean;
  body?: unknown;
}

export class ADRestClient {
  constructor() { }

  async getRepositories(
    searchTerm?: string,
    filter: "all" | "mcps" | "agents" = "all",
    oldestFirst: boolean = false,
    ownedOnly: boolean = false,
    organizationId: string = "",
  ): Promise<Repository[]> {
    const showPrivate = organizationId !== "" ? true : false;
    const params = new URLSearchParams({
      "pagination.pageSize": "100",
      "order.orderBy": "createdAt",
      includeRecords: "true",
      notEmpty: "true",
      ownedOnly: ownedOnly.toString(),
      recordsFilter: `${filter}`,
    });

    if (searchTerm && searchTerm.length) {
      params.append("filters.searchQuery", searchTerm);
    }
    if (oldestFirst) {
      params.append("order.order", "ORDER_ASC");
    }

    if (organizationId !== "") {
      params.append("filters.showPrivate", "true");
      params.append("organizationId", organizationId);
    }
    
    const response = await this._request<GetRepositoriesResponse>({
      method: "GET",
      endpoint: `/v1alpha1/repositories?${params.toString()}`,
      withAuth: organizationId ? true : false,
    });
    return response.repositories ?? [];
  }

  async getOrganizations(): Promise<GetOrganizationsResponse> {
    const response = await this._request<GetOrganizationsResponse>({
      method: "GET",
      endpoint: `/v1alpha1/organizations`,
      withAuth: true,
    });
    return response;
  }

  private async _request<T>({
    method,
    endpoint,
    withAuth = false,
    body,
  }: RequestOptions): Promise<T> {
    const { directoryURL, accessToken, isLoggedIn } = getConfigs();
    const directoryAPI = this.getAPIFromURL(directoryURL);
    if (withAuth && accessToken === undefined) {
      console.log("Access token is not defined. Please log in first.");
    }


    let url = directoryAPI.replace(/\/+$/, "");
    url = `${url}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (withAuth && isLoggedIn && accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const responseBody = await response.text();
      throw new APIError(response.status, response.statusText, responseBody);
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
      responseBody = await response.text();
      throw new APIError(response.status, response.statusText, responseBody);
    }

    return (responseBody) as T;
  }

  private getAPIFromURL(url: string): string {
    const parsedURL = new URL(url);
    const hostParts = parsedURL.hostname.split(".");
    hostParts.unshift('api');
    parsedURL.hostname = hostParts.join(".");
    return parsedURL.toString();
  }
}
