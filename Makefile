# Copyright © 2025 Cisco Systems, Inc. and its affiliates.
# All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

.PHONY: all install build lint test package clean run

all: build

install:
	@npm install

build:
	@npm run compile

lint:
	@npm run lint

lint-fix:
	@npx eslint src --fix

test:
	@npm run test

package: build
	@npx vsce package

clean:
	@rm -rf out node_modules *.vsix

run:
	@code --extensionDevelopmentPath=$(shell pwd)
