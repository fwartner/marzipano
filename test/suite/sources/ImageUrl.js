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

import ImageUrlSource from '../../../src/sources/ImageUrl.js';

function MockStage() {}

MockStage.prototype.loadImage = function (url, rect, done) {
  if (url === 'url' && rect == null) {
    done(null, 'asset');
  } else if (url === 'url-rect' && rect === 'rect') {
    done(null, 'asset-rect');
  } else if (url === 'url-error') {
    done(new Error('error'));
  }
  return function () {};
};

describe('ImageUrlSource', function () {
  it('template url', function () {
    return new Promise((resolve) => {
      const source = ImageUrlSource.fromString('http://localhost/img?f={f}&z={z}&x={x}&y={y}');

      var spy = sinon.stub().returns(function () {});
      var stage = { loadImage: spy };

      source.loadAsset(stage, { face: 'l', z: 0, x: 1, y: 2 });
      source.loadAsset(stage, { face: 'r', z: 3, x: 4, y: 5 });

      wait.until(
        function () {
          return spy.callCount === 2;
        },
        function () {
          assert.strictEqual(spy.getCall(0).args[0], 'http://localhost/img?f=l&z=0&x=1&y=2');
          assert.strictEqual(spy.getCall(0).args[1], undefined);
          assert.strictEqual(spy.getCall(1).args[0], 'http://localhost/img?f=r&z=3&x=4&y=5');
          assert.strictEqual(spy.getCall(1).args[1], undefined);
          resolve();
        }
      );
    });
  });

  it('template url with preview', function () {
    return new Promise((resolve) => {
      var defaultOrder = 'bdflru';

      const source = ImageUrlSource.fromString('http://localhost/img?f={f}&z={z}&x={x}&y={y}', {
        cubeMapPreviewUrl: 'http://localhost/preview',
        concurrency: 10,
      });

      var spy = sinon.stub().returns(function () {});
      var stage = { loadImage: spy };

      for (var i = 0; i < 6; i++) {
        source.loadAsset(stage, { face: defaultOrder[i], z: 0, x: 0, y: 0 });
      }
      source.loadAsset(stage, { face: 'l', z: 1, x: 2, y: 3 });

      wait.until(
        function () {
          return stage.loadImage.callCount === 7;
        },
        function () {
          for (var i = 0; i < 6; i++) {
            assert.strictEqual(spy.getCall(i).args[0], 'http://localhost/preview');
            assert.deepEqual(spy.getCall(i).args[1], { x: 0, y: i / 6, width: 1, height: 1 / 6 });
          }
          assert.strictEqual(spy.getCall(6).args[0], 'http://localhost/img?f=l&z=1&x=2&y=3');
          assert.strictEqual(spy.getCall(6).args[1], undefined);
          resolve();
        }
      );
    });
  });

  it('template url with preview in custom order', function () {
    return new Promise((resolve) => {
      var customOrder = 'udtblr';

      const source = ImageUrlSource.fromString('http://localhost/img?f={f}&z={z}&x={x}&y={y}', {
        cubeMapPreviewUrl: 'http://localhost/preview',
        cubeMapPreviewFaceOrder: customOrder,
        concurrency: 10,
      });

      var spy = sinon.stub().returns(function () {});
      var stage = { loadImage: spy };

      for (var i = 0; i < 6; i++) {
        source.loadAsset(stage, { face: customOrder[i], z: 0, x: 0, y: 0 });
      }
      source.loadAsset(stage, { face: 'l', z: 1, x: 2, y: 3 });

      wait.until(
        function () {
          return stage.loadImage.callCount === 7;
        },
        function () {
          for (var i = 0; i < 6; i++) {
            assert.strictEqual(spy.getCall(i).args[0], 'http://localhost/preview');
            assert.deepEqual(spy.getCall(i).args[1], { x: 0, y: i / 6, width: 1, height: 1 / 6 });
          }
          assert.strictEqual(spy.getCall(6).args[0], 'http://localhost/img?f=l&z=1&x=2&y=3');
          assert.strictEqual(spy.getCall(6).args[1], undefined);
          resolve();
        }
      );
    });
  });

  it('full rect', function () {
    return new Promise((resolve) => {
      var stage = new MockStage();

      var tileToUrl = sinon.stub().withArgs('tile').returns({ url: 'url' });

      var source = new ImageUrlSource(tileToUrl);
      source.loadAsset(stage, 'tile', function (err, tile, asset) {
        assert.isNull(err);
        assert.strictEqual('tile', tile);
        assert.strictEqual('asset', asset);
        resolve();
      });
    });
  });

  it('partial rect', function () {
    return new Promise((resolve) => {
      var stage = new MockStage();

      var tileToUrl = sinon.stub().withArgs('tile').returns({ url: 'url-rect', rect: 'rect' });

      var source = new ImageUrlSource(tileToUrl);
      source.loadAsset(stage, 'tile', function (err, tile, asset) {
        assert.isNull(err);
        assert.strictEqual(tile, 'tile');
        assert.strictEqual(asset, 'asset-rect');
        resolve();
      });
    });
  });

  it('error', function () {
    return new Promise((resolve) => {
      var stage = new MockStage();

      var tileToUrl = sinon.stub().withArgs('tile').returns({ url: 'url-error' });

      var source = new ImageUrlSource(tileToUrl);
      source.loadAsset(stage, 'tile', function (err, tile, asset) {
        assert.instanceOf(err, Error);
        assert.strictEqual(tile, 'tile');
        assert.isNotOk(asset);
        resolve();
      });
    });
  });

  // TODO: Test retry ratelimiting.
});
