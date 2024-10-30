/**
Copyright 2022 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


'use strict';

import { CastQueue } from './queuing.js';
import { MediaFetcher } from './media_fetcher.js';
import { AdsTracker, SenderTracker, ContentTracker } from './cast_analytics.js';

/**
 * @fileoverview This sample demonstrates how to build your own Web Receiver for
 * use with Google Cast. The main receiver implementation is provided in this
 * file which sets up access to the CastReceiverContext and PlayerManager. Some
 * added functionality can be enabled by uncommenting some of the code blocks
 * below.
 */


/*
 * Convenience variables to access the CastReceiverContext and PlayerManager.
 */
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

/*
 * Constant to be used for fetching media by entity from sample repository.
 */
const ID_REGEX = '\/?([^\/]+)\/?$';

/**
 * Debug Logger
 */
const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
const LOG_RECEIVER_TAG = 'Receiver';

/*
 * WARNING: Make sure to turn off debug logger for production release as it
 * may expose details of your app.
 * Uncomment below line to enable debug logger, show a 'DEBUG MODE' tag at
 * top left corner and show debug overlay.
 */
//  context.addEventListener(cast.framework.system.EventType.READY, () => {
//   if (!castDebugLogger.debugOverlayElement_) {
//     /**
//      *  Enable debug logger and show a 'DEBUG MODE' tag at
//      *  top left corner.
//      */
//       castDebugLogger.setEnabled(true);

//     /**
//      * Show debug overlay.
//      */
//       castDebugLogger.showDebugLogs(true);
//   }
// });

/*
 * Set verbosity level for Core events.
 */
castDebugLogger.loggerLevelByEvents = {
  'cast.framework.events.category.CORE':
    cast.framework.LoggerLevel.INFO,
  'cast.framework.events.EventType.MEDIA_STATUS':
    cast.framework.LoggerLevel.DEBUG
};

if (!castDebugLogger.loggerLevelByTags) {
  castDebugLogger.loggerLevelByTags = {};
}

/*
 * Set verbosity level for custom tag.
 * Enables log messages for error, warn, info and debug.
 */
castDebugLogger.loggerLevelByTags[LOG_RECEIVER_TAG] =
  cast.framework.LoggerLevel.DEBUG;

playerManager.setMediaPlaybackInfoHandler((loadRequestData) => {
    const mediaInformation = loadRequestData.media;
    if (mediaInformation.contentProtection) {
        mediaInformation.contentProtection['com.widevine.alpha'] = {
            licenseUrl: "https://udrmv3.kaltura.com/cenc/widevine/license?custom_data=eyJjYV9zeXN0ZW0iOiJodHRwczovL3Jlc3QtYXMub3R0LmthbHR1cmEuY29tL2FwaV92My9zZXJ2aWNlL2Fzc2V0RmlsZS9hY3Rpb24vZ2V0Q29udGV4dD9rcz1kako4TVRRM2ZMcXRXcTFTZ3NwSDN4eUdCclhpTWVwR0U4bnZPRVFtX3FCZjBDUFg0OE5EbTNIcWpnb1AxMTVDN2MwYWNjanowZmFOTGdVU3NpMFBPSTJSS0JuTENHQVBuMFRBbk9sWU93aktTRFFKTkJ4VWYxUWh5X0duYnRlMmVrQTB2eWk0eFktaU5ubGFzOVVyYnpRR1F6R1BqYTc3a0RLRTdMNW9jekJldGF3Z012VE5IYjFzb2VwTVJxcXh5Um1SM3JRV1JibmVJZ1l4WV80TjZ3VTFWZEFDQ1Ftby1tLUpfazlwNzlHalRBRVZqaFcyRmNNR0FiR0w5SEhRbVhtV3ExbmJwX195Q2xyWkdPT1p6dGZmWUp3bE81Mjd3VHVybXJ1TXIwdmpDZ3l0VE5BMkstMy1zNnhibldzUjA3eUJlOFpxM3FSR252VU5xVUZPNUxXYTlGNm1UNWs9JmNvbnRleHRUeXBlPW5vbmUmaWQ9OTgyNjk5MSIsImFjY291bnRfaWQiOjIwODIzMTEsImNvbnRlbnRfaWQiOiJmdGFfY2g4X2Rhc2hfMjAwNDVjNDNlOWU5X2Ntbl8yIiwiZmlsZXMiOiIiLCJ1c2VyX3Rva2VuIjoiZGpKOE1UUTNmTHF0V3ExU2dzcEgzeHlHQnJYaU1lcEdFOG52T0VRbV9xQmYwQ1BYNDhORG0zSHFqZ29QMTE1QzdjMGFjY2p6MGZhTkxnVVNzaTBQT0kyUktCbkxDR0FQbjBUQW5PbFlPd2pLU0RRSk5CeFVmMVFoeV9HbmJ0ZTJla0EwdnlpNHhZLWlObmxhczlVcmJ6UUdRekdQamE3N2tES0U3TDVvY3pCZXRhd2dNdlROSGIxc29lcE1ScXF4eVJtUjNyUVdSYm5lSWdZeFlfNE42d1UxVmRBQ0NRbW8tbS1KX2s5cDc5R2pUQUVWamhXMkZjTUdBYkdMOUhIUW1YbVdxMW5icF9feUNsclpHT09aenRmZllKd2xPNTI3d1R1cm1ydU1yMHZqQ2d5dFROQTJLLTMtczZ4Ym5Xc1IwN3lCZThacTNxUkdudlVOcVVGTzVMV2E5RjZtVDVrPSIsInVkaWQiOiIiLCJhZGRpdGlvbmFsX2Nhc19zeXN0ZW0iOjE0N30%3d&signature=6ji1J9Z%2b63a1HSZiUtwpwc5nvhk%3d"
        };
    }
    return mediaInformation;
});

/*
 * Example of how to listen for events on playerManager.
 */
playerManager.addEventListener(
  cast.framework.events.EventType.ERROR, (event) => {
    castDebugLogger.error(LOG_RECEIVER_TAG,
      'Detailed Error Code - ' + event.detailedErrorCode);
    if (event && event.detailedErrorCode == 905) {
      castDebugLogger.error(LOG_RECEIVER_TAG,
        'LOAD_FAILED: Verify the load request is set up ' +
        'properly and the media is able to play.');
    }
});

/*
 * DRM handling
 */

/*
 * Example analytics tracking implementation. To enable this functionality see
 * the implmentation and complete the TODO item in ./google_analytics.js. Once
 * complete uncomment the the calls to startTracking below to enable each
 * Tracker.
 */
const adTracker = new AdsTracker();
const senderTracker = new SenderTracker();
const contentTracker = new ContentTracker();
// adTracker.startTracking();
// senderTracker.startTracking();
// contentTracker.startTracking();

/**
 * Modifies the provided mediaInformation by adding a pre-roll break clip to it.
 * @param {cast.framework.messages.MediaInformation} mediaInformation The target
 * MediaInformation to be modified.
 * @return {Promise} An empty promise.
 */
function addBreaks(mediaInformation) {
  castDebugLogger.debug(LOG_RECEIVER_TAG, "addBreaks: " +
    JSON.stringify(mediaInformation));
  return MediaFetcher.fetchMediaById('fbb_ad')
  .then((clip1) => {
    mediaInformation.breakClips = [
      {
        id: 'fbb_ad',
        title: clip1.title,
        contentUrl: clip1.stream.dash,
        contentType: 'application/dash+xml',
        whenSkippable: 5
      }
    ];

    mediaInformation.breaks = [
      {
        id: 'pre-roll',
        breakClipIds: ['fbb_ad'],
        position: 0
      }
    ];
  });
}

/*
 * Intercept the LOAD request to load and set the contentUrl.
 */
playerManager.setMessageInterceptor(
  cast.framework.messages.MessageType.LOAD, loadRequestData => {
    castDebugLogger.debug(LOG_RECEIVER_TAG,
      `loadRequestData: ${JSON.stringify(loadRequestData)}`);

    // If the loadRequestData is incomplete, return an error message.
    if (!loadRequestData || !loadRequestData.media) {
      const error = new cast.framework.messages.ErrorData(
        cast.framework.messages.ErrorType.LOAD_FAILED);
      error.reason = cast.framework.messages.ErrorReason.INVALID_REQUEST;
      return error;
    }

    // Check all content source fields for the asset URL or ID.
    let source = loadRequestData.media.contentUrl
      || loadRequestData.media.entity || loadRequestData.media.contentId;

    // If there is no source or a malformed ID then return an error.
    if (!source || source == "" || !source.match(ID_REGEX)) {
      let error = new cast.framework.messages.ErrorData(
        cast.framework.messages.ErrorType.LOAD_FAILED);
      error.reason = cast.framework.messages.ErrorReason.INVALID_REQUEST;
      return error;
    }

    let sourceId = source.match(ID_REGEX)[1];

    // Optionally add breaks to the media information and set the contentUrl.
    return Promise.resolve()
    // .then(() => addBreaks(loadRequestData.media)) // Uncomment to enable ads.
    .then(() => {
      // If the source is a url that points to an asset don't fetch from the
      // content repository.
      if (sourceId.includes('.')) {
        castDebugLogger.debug(LOG_RECEIVER_TAG,
          "Interceptor received full URL");
        loadRequestData.media.contentUrl = source;
        return loadRequestData;
      } else {
        // Fetch the contentUrl if provided an ID or entity URL.
        castDebugLogger.debug(LOG_RECEIVER_TAG, "Interceptor received ID");
        return MediaFetcher.fetchMediaInformationById(sourceId)
        .then((mediaInformation) => {
          loadRequestData.media = mediaInformation;
          return loadRequestData;
        })
      }
    })
    .catch((errorMessage) => {
      let error = new cast.framework.messages.ErrorData(
        cast.framework.messages.ErrorType.LOAD_FAILED);
      error.reason = cast.framework.messages.ErrorReason.INVALID_REQUEST;
      castDebugLogger.error(LOG_RECEIVER_TAG, errorMessage);
      return error;
    });
  }
);


/*
 * Set the control buttons in the UI controls.
 */
const controls = cast.framework.ui.Controls.getInstance();
controls.clearDefaultSlotAssignments();

// Assign buttons to control slots.
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_SECONDARY_1,
  cast.framework.ui.ControlsButton.QUEUE_PREV
);
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_PRIMARY_1,
  cast.framework.ui.ControlsButton.CAPTIONS
);
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_PRIMARY_2,
  cast.framework.ui.ControlsButton.SEEK_FORWARD_15
);
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_SECONDARY_2,
  cast.framework.ui.ControlsButton.QUEUE_NEXT
);

/*
 * Configure the CastReceiverOptions.
 */
const castReceiverOptions = new cast.framework.CastReceiverOptions();

/*
 * Set the player configuration.
 */
const playbackConfig = new cast.framework.PlaybackConfig();
playbackConfig.autoResumeDuration = 5;
castReceiverOptions.playbackConfig = playbackConfig;
castDebugLogger.info(LOG_RECEIVER_TAG,
  `autoResumeDuration set to: ${playbackConfig.autoResumeDuration}`);

/* 
 * Set the SupportedMediaCommands.
 */
castReceiverOptions.supportedCommands =
  cast.framework.messages.Command.ALL_BASIC_MEDIA |
  cast.framework.messages.Command.QUEUE_PREV |
  cast.framework.messages.Command.QUEUE_NEXT |
  cast.framework.messages.Command.STREAM_TRANSFER

/*
 * Optionally enable a custom queue implementation. Custom queues allow the
 * receiver app to manage and add content to the playback queue. Uncomment the
 * line below to enable the queue.
 */
// castReceiverOptions.queue = new CastQueue();

context.start(castReceiverOptions);
