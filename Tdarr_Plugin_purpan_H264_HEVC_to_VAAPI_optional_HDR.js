/* eslint-disable */
// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_purpan_H264_HEVC_to_VAAPI_optional_HDR',
  Stage: 'Pre-processing',
  Name: 'purpan- H264/HEVC to VAAPI with Optional HDR',
  Type: 'Video',
  Operation: 'Transcode',
  Description:
    `This  plugin will transcode H264 or reconvert HEVC files using VAAPI with bframes, 10bit, and (optional) HDR. Requires Intel Quick Sync Video or AMD VCE hardware acceleration.  
    If reconvert HEVC is on and the entire file is over the bitrate filter, the HEVC stream will be re-encoded. Typically results in a 50-75% smaller size with little to no quality loss.
    When setting the re-encode bitrate filter be aware that it is a file total bitrate, so leave overhead for audio.
This plugin implements the filter_by_stream_tag plugin to prevent infinite loops caused by reprocessing files above the filter or target bitrate.
By default, all settings are ideal for most use cases.
Version 1.4: Modified to use VAAPI hardware acceleration instead of NVENC.`,
  //    Original plugin created by tws101 who was inspired by DOOM and MIGZ
  //    This version edited by /u/purpan
  Version: '1.4',
  Tags: 'pre-processing,ffmpeg,vaapi h265, hdr',
  Inputs: [
    {
      name: 'target_bitrate_480p576p',
      type: 'number',
      defaultValue: 1000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the target bitrate in kilobits for 480p and 576p files.  Example 400 equals 400k',
    },
    {
      name: 'target_bitrate_720p',
      type: 'number',
      defaultValue: 2000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the target bitrate in kilobits for 720p files. Example 400 equals 400k',
    },
    {
      name: 'target_bitrate_1080p',
      type: 'number',
      defaultValue: 4000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the target bitrate in kilobits for 1080p files. Example 400 equals 400k',
    },
    {
      name: 'target_bitrate_4KUHD',
      type: 'number',
      defaultValue: 8000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the target bitrate in kilobits for 4KUHD files. Example 400 equals 400k',
    },
    {
      name: 'target_pct_reduction',
      type: 'number',
      defaultValue: 0.5,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the target reduction for H264 bitrates if the current bitrate is less than resolution targets.',
    },
    {
      name: 'bframes',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Enables or disables bframes from being used. Sacrifices some detail for better compression. Requires VAAPI hardware acceleration support',
    },
{
      name: 'reconvert_hevc',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Will reconvert hevc files that are above the hevc_resolution_filter_bitrate',
    },
{
      name: 'reconvert_hdr',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Enable or disable reconverting HDR files. NOT recommended for HDR10/+/Dolby Vision files as it strips some HDR metadata and leaves just PQ',
    },
  {
      name: 'hevc_480p_576p_filter_bitrate',
      type: 'number',
      defaultValue: 2000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Filter bitrate in kilobits to reconvert_480p_576p_hevc. Example 1200 equals 1200k ',
    },
  {
      name: 'hevc_720p_filter_bitrate',
      type: 'number',
      defaultValue: 3000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Filter bitrate in kilobits to reconvert_720p_hevc. Example 1200 equals 1200k ',
    },
  {
      name: 'hevc_1080p_filter_bitrate',
      type: 'number',
      defaultValue: 4000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Filter bitrate in kilobits to reconvert_1080p_hevc. Example 1200 equals 1200k ',
    },
  {
      name: 'hevc_filter_bitrate_4KUHD',
      type: 'number',
      defaultValue: 8000,
      inputUI: {
        type: 'text',
      },
      tooltip: 'Filter bitrate in kilobits to reconvert_4KUHD_hevc. Example 1200 equals 1200k',
    },
    {
      name: 'tagName',
      type: 'string',
      defaultValue: 'COPYRIGHT',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the stream tag to check. By default, this metadata is added during the transcode process and no tagging options need to be changed',
    },
    {
      name: 'tagValues',
      type: 'string',
      defaultValue: 'processed',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of tag values to check for. By default, this metadata is added during the transcode process and no tagging options need to be changed',
    },
    {
      name: 'exactMatch',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip:
      'Specify true if the property value must be an exact match,'
      + ' false if the property value must contain the value.',
    },
    {
      name: 'continueIfTagFound',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip:
        'Specify whether to continue the plugin stack if the tag is found. This should almost never be True unless you want to transcode files twice',
    },
  ],
});
// #region Helper Classes/Modules
/**
* Handles logging in a standardised way.
*/
class Log {
  constructor() {
    this.entries = [];
  }
  /**
   *
   * @param {String} entry the log entry string
   */
  Add(entry) {
    this.entries.push(entry);
  }
  /**
   *
   * @param {String} entry the log entry string
   */
  AddSuccess(entry) {
    this.entries.push(`☑ ${entry}`);
  }
  /**
   *
   * @param {String} entry the log entry string
   */
  AddError(entry) {
    this.entries.push(`☒ ${entry}`);
  }
  /**
   * Returns the log lines separated by new line delimiter.
   */
  GetLogData() {
    return this.entries.join('\n');
  }
}
/**
* Handles the storage of FFmpeg configuration.
*/
class Configurator {
  constructor(defaultOutputSettings = null) {
    this.shouldProcess = false;
    this.outputSettings = defaultOutputSettings || [];
    this.inputSettings = [];
  }
  AddInputSetting(configuration) {
    if (configuration && configuration.trim() !== '') {
        this.inputSettings.push(configuration);
    }
  }
  AddOutputSetting(configuration) {
    this.shouldProcess = true;
    this.outputSettings.push(configuration);
  }
  ResetOutputSetting(configuration) {
    this.shouldProcess = false;
    this.outputSettings = configuration;
  }
  RemoveOutputSetting(configuration) {
    const index = this.outputSettings.indexOf(configuration);
    if (index === -1) return;
    this.outputSettings.splice(index, 1);
  }
  GetOutputSettings() {
    return this.outputSettings.join(' ');
  }
  GetInputSettings() {
    return this.inputSettings.join(' ');
  }
}
// #endregion
// #region Plugin Methods
/**
* Abort Section
*/
function checkAbort(inputs, file, logger) {
  if (file.fileMedium !== 'video') {
    logger.AddError('File is not a video.');
    return true;
  }
  return false;
}
/**
* Calculate Bitrate
*/
function calculateBitrate(file) {
  let bitrateProbe = file.ffProbeData.streams[0].bit_rate;
  if (isNaN(bitrateProbe)) {
    bitrateProbe = file.bit_rate;
  }
  return bitrateProbe;
}
/**
* Loops over the file streams and executes the given method on
* each stream when the matching codec_type is found.
* @param {Object} file the file.
* @param {string} type the typeo of stream.
* @param {function} method the method to call.
*/
function loopOverStreamsOfType(file, type, method) {
  let id = 0;
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}
function checkHDRMetadata(stream, id, inputs, logger, configuration) {
  const hdrColorSpaces = ['smpte2084', 'bt2020', 'bt2020nc'];
  logger.Add(`Checking HDR Metadata for video stream ${id}`);
  if (stream.color_space && hdrColorSpaces.includes(stream.color_space)) {
    logger.Add(`HDR Color Space detected in video stream ${id}: ${stream.color_space}`);
    if (!inputs.reconvert_hdr) {
      logger.AddError(`HDR Metadata detected in video stream ${id}. Skipping encoding due to reconvert_hdr set to false.`);
      return false; // Returning false to indicate HDR detected but reconvert_hdr is false
    }
    logger.AddSuccess(`HDR Metadata detected in video stream ${id}. Maintaining.`);
    // Add HDR configuration to the output settings
    if (stream.color_space === 'bt2020nc') {
      logger.Add(`Applying HDR configuration to stream ${id}: -color_primaries bt2020 -colorspace bt2020nc -color_trc smpte2084`);
      configuration.AddOutputSetting(' -strict unofficial -color_primaries bt2020 -colorspace bt2020nc -color_trc smpte2084 ');
    }
    return true; // HDR detected and reconvert_hdr is true, continue encoding
  }
  logger.Add(`No HDR Metadata detected in video stream ${id}. Continuing encoding.`);
  return true; // HDR not detected, continue encoding
}
/**
* Video, Map EVERYTHING and encode video streams to 265
*/
function buildVideoConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['-map 0']); // -map 0 is an output option
  const tiered = {
    '480p': {
      bitrate: inputs.target_bitrate_480p576p,
      max_increase: 100,
      cq: 22,
    },
    '576p': {
      bitrate: inputs.target_bitrate_480p576p,
      max_increase: 100,
      cq: 22
    },
    '720p': {
      bitrate: inputs.target_bitrate_720p,
      max_increase: 200,
      cq: 23
    },
    '1080p': {
      bitrate: inputs.target_bitrate_1080p,
      max_increase: 400,
      cq: 24
    },
    '4KUHD': {
      bitrate: inputs.target_bitrate_4KUHD,
      max_increase: 400,
      cq: 26 ,
    },
    Other: {
      bitrate: inputs.target_bitrate_1080p,
      max_increase: 400,
      cq: 24,
    },
  };
  // These are HWAccel decoders, thus input options
  const inputDecoderSettings = {
    h263: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    h264: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    mjpeg: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    mpeg1: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    mpeg2: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    vc1: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    vp8: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    vp9: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
    hevc: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi',
  };


  function videoProcess(stream, id) {
    if (stream.codec_name === 'mjpeg') {
      configuration.AddOutputSetting(`-map -v:${id}`); // Output option
      return;
    }
    if (!checkHDRMetadata(stream, id, inputs, logger, configuration)) {
      return;
    }

    const filterBitrate480 = (inputs.hevc_480p_576p_filter_bitrate * 1000);
    const filterBitrate720 = (inputs.hevc_720p_filter_bitrate * 1000);
    const filterBitrate1080 = (inputs.hevc_1080p_filter_bitrate * 1000);
    const filterBitrate4k = (inputs.hevc_filter_bitrate_4KUHD * 1000);
    const fileResolution = file.video_resolution;
    const reconvert = inputs.reconvert_hevc;
    const res480p = '480p';
    const res576p = '576p';
    const res720p = '720p';
    const res1080p = '1080p';
    const res4k = '4KUHD';

    if (reconvert === false) {
      if (stream.codec_name === 'hevc' || stream.codec_name === 'vp9') {
        logger.AddSuccess(`Video stream ${id} is hevc, and hevc reconvert is off`);
        return;
      }
    }

    function reconvertcheck(filterbitrate, res, res2) {
      if ((filterbitrate > 0) && ((fileResolution === res) || (fileResolution === res2))) {
            if ((stream.codec_name === 'hevc' || stream.codec_name === 'vp9') && (file.bit_rate < filterbitrate)) {
            logger.AddSuccess(`Video stream ${id} bitrate is below the HEVC/VP9 filter criteria: Bitrate Criteria (${filterbitrate} kbps) > File Bitrate (${file.bit_rate} kbps)`);
            return true;
          } else if (stream.codec_name === 'hevc' || stream.codec_name === 'vp9') {
            logger.Add(`Video stream ${id} is HEVC/VP9 and its bitrate (${file.bit_rate} kbps) is above filter (${filterbitrate} kbps)`);
            }
          }
          return false;
    }

    const bool480 = reconvertcheck(filterBitrate480, res480p, res576p);
    const bool720 = reconvertcheck(filterBitrate720, res720p);
    const bool1080 = reconvertcheck(filterBitrate1080, res1080p);
    const bool4k = reconvertcheck(filterBitrate4k, res4k);
    if (bool480 === true || bool720 === true || bool1080 === true || bool4k === true) {
      return;
    }

    if (stream.codec_name === 'png') {
      configuration.AddOutputSetting(`-map -0:v:${id}`); // Output option
    } else {
      const bitrateProbe = (calculateBitrate(file) / 1000);
      let bitrateTarget = 0;
      const tier = tiered[file.video_resolution];
      if (tier == null) {
        logger.AddError('Plugin does not support the files video resolution');
        return;
      }
      const bitrateCheck = parseInt(tier.bitrate);
      if (bitrateProbe !== null && bitrateProbe < bitrateCheck) {
        bitrateTarget = parseInt(bitrateProbe * inputs.target_pct_reduction);
      } else {
        bitrateTarget = parseInt(tier.bitrate);
      }
      const bitrateMax = bitrateTarget + tier.max_increase;
      const { cq } = tier;

      // Add output video encoding settings - VAAPI equivalent of original NVENC "slow" preset
      configuration.AddOutputSetting(`-vf 'format=p010le,hwupload' -c:v hevc_vaapi -profile:v main10 -pix_fmt p010le -qmin 0 -qp ${cq} -b:v ${bitrateTarget}k -maxrate:v ${bitrateMax}k -compression_level 1 -quality 6 -low_power 0 -look_ahead 1 -idr_interval 250 -metadata:s:v:0 COPYRIGHT=processed`);
      
      // Add input decoder settings if specified
      const decoderSetting = inputDecoderSettings[file.video_codec_name];
      if (decoderSetting !== undefined && decoderSetting.trim() !== '') {
          configuration.AddInputSetting(decoderSetting);
      }
      // The specific h264_cuvid logic that caused issues was removed previously.
      // Now relying on inputDecoderSettings['h264'] = '' for auto-selection.

      logger.Add(`Transcoding stream ${id} to HEVC using VAAPI`);
    }
  }

  loopOverStreamsOfType(file, 'video', videoProcess);

  if (!configuration.shouldProcess) {
    logger.AddSuccess('No video processing necessary');
  }
  return configuration;
}
/**
* Audio, set audio to copy
*/
function buildAudioConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['-c:a copy']); // Output option
  return configuration;
}
/**
* Subtitles, set subs to copy
*/
function buildSubtitleConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['-c:s copy']); // Output option
  return configuration;
}
function checkTags(file, inputs) {
  const { strHasValue } = require('../methods/utils');
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    infoLog: '',
  };
  if (inputs.tagName.trim() === '') {
    response.infoLog += 'No input tagName entered in plugin, skipping \n';
    return response;
  }
  const tagName = inputs.tagName.trim();
  if (inputs.tagValues.trim() === '') {
    response.infoLog += 'No input tagValues entered in plugin, skipping \n';
    return response;
  }
  const tagValues = inputs.tagValues.trim().split(',');
  // Loop through file streams to check for the specified tag
  let streamContainsTag = false;
  try {
    for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
      if (file.ffProbeData.streams[i]?.tags && strHasValue(tagValues, file.ffProbeData.streams[i].tags[tagName], inputs.exactMatch)) {
        streamContainsTag = true;
        break;
      }
    }
    const message = `A stream with tag name ${tagName} containing ${tagValues.join(',')} has`;
    // Handling encoding skipping based on tag presence
    if (inputs.continueIfTagFound === true) {
      if (streamContainsTag === true) {
        response.processFile = true; // Continue encoding if tag found
        response.infoLog += `${message} been found but continue_if_tag_found is True. Continuing to encoding.  \n`;
        console.log(`${message} been found but continue_if_tag_found is True. Continuing to encoding.`);
      } else {
        response.processFile = true; // Continue encoding if tag not found
        response.infoLog += `${message} not been found and continue_if_tag_found is True. Continuing to encoding.  \n`;
        console.log(`${message} not been found and continue_if_tag_found is True. Continuing to encoding.`);
      }
    } else if (inputs.continueIfTagFound === false) {
      if (streamContainsTag === true) {
        response.processFile = false; // Skip encoding if tag found
        response.infoLog += `${message} been found and continue_if_tag_found is False. Skipping encoding.  \n`;
        console.log(`${message} been found and continue_if_tag_found is False. Skipping encoding.`);
      } else {
        response.processFile = true; // Resume encoding if tag not found
        response.infoLog += `${message} not been found and continue_if_tag_found is False. Continuing to encoding. \n`;
        console.log(`${message} not been found and continue_if_tag_found is False. Continuing to encoding.`);
      }
    }
  } catch (err) {
    console.log(err);
    response.infoLog += err;
    response.processFile = false; // Set default to skip encoding in case of error
  }
  return response;
}
// #endregion
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const { strHasValue } = require('../methods/utils');
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: '',
    processFile: false,
    preset: '',
    reQueueAfter: true,
  };
  const logger = new Log();
  const tagCheck = checkTags(file, inputs);
  if (!tagCheck.processFile) {
    response.processFile = false;
    response.infoLog += tagCheck.infoLog;
    return response;
  }
  const abort = checkAbort(inputs, file, logger);
  if (abort) {
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }

  const videoSettings = buildVideoConfiguration(inputs, file, logger);
  const audioSettings = buildAudioConfiguration(inputs, file, logger); // Primarily output settings
  const subtitleSettings = buildSubtitleConfiguration(inputs, file, logger); // Primarily output settings

  // Start with input-specific options
  // -analyzeduration and -probesize are input options
  let inputOptions = '-analyzeduration 2147483647 -probesize 2147483647';
  const videoInputSettings = videoSettings.GetInputSettings();
  if (videoInputSettings && videoInputSettings.trim() !== '') {
    inputOptions += ` ${videoInputSettings}`;
  }

  // Consolidate all output options
  let outputOptions = videoSettings.GetOutputSettings();
  outputOptions += ` ${audioSettings.GetOutputSettings()}`;
  outputOptions += ` ${subtitleSettings.GetOutputSettings()}`;
  outputOptions += ' -max_muxing_queue_size 9999'; // This is an output option

  // b frames argument (output option) - VAAPI doesn't support b_ref_mode
  if (inputs.bframes === true) {
    outputOptions += ' -bf 2';
  }
  
  // Construct the preset string: INPUT_OPTIONS,OUTPUT_OPTIONS
  // Ensure there's always a comma, even if inputOptions is just the probesize/analyzeduration
  response.preset = `${inputOptions.trim()},${outputOptions.trim()}`;

  response.processFile = videoSettings.shouldProcess;
  if (!response.processFile) {
    logger.AddSuccess('No need to process file');
  }
  response.infoLog += logger.GetLogData();
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
