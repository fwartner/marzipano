/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { assert } from 'chai';
import sinon from 'sinon';
import wait from '../../wait.js';

import defer from '../../../src/util/defer.js';

describe('defer', function () {
  it('without arguments', function () {
    return new Promise((resolve) => {
      var spy = sinon.spy();
      defer(spy);
      wait.untilSpyCalled(spy, function () {
        assert.isTrue(spy.calledWithExactly());
        resolve();
      });
    });
  });

  it('with arguments', function () {
    return new Promise((resolve) => {
      var spy = sinon.spy();
      defer(spy, [1, 2, 3]);
      wait.untilSpyCalled(spy, function () {
        assert.isTrue(spy.calledWithExactly(1, 2, 3));
        resolve();
      });
    });
  });
});
