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


import * as assert from 'assert';
import { _isLoggedIn } from '../../../config/readSession';

suite('readSession Test Suite', () => {
    test('_isLoggedIn should return true for a valid, non-expired token', () => {
        const futureEpoch = Math.floor(new Date().getTime() / 1000) + 3600; // 1 hour from now
        const payload = { "exp": futureEpoch };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `header.${encodedPayload}.signature`;
        assert.strictEqual(_isLoggedIn(token), true, 'Should be logged in with a valid token');
    });

    test('_isLoggedIn should return false for an expired token', () => {
        const pastEpoch = Math.floor(new Date().getTime() / 1000) - 3600; // 1 hour ago
        const payload = { "exp": pastEpoch };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `header.${encodedPayload}.signature`;
        assert.strictEqual(_isLoggedIn(token), false, 'Should be logged out with an expired token');
    });
});
