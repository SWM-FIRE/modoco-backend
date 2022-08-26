'use strict';

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['modoco-backend'],
  /**
   * Your New Relic license key.
   */
  license_key: 'd0d33b4aa52ddac0e9820187a8d11ab6c9b8NRAL',
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'trace',
    enabled: false,
  },
  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,
  application_logging: {
    forwarding: {
      /**
       * Toggles whether the agent gathers log records for sending to New Relic.
       */
      enabled: true,
    },
  },
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end.
     *
     * NOTE: If excluding headers, they must be in camelCase form to be filtered.
     *
     * @env NEW_RELIC_ATTRIBUTES_EXCLUDE
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
  /**
   * Browser Monitoring
   *
   * Browser monitoring lets you correlate transactions between the server and browser
   * giving you accurate data on how long a page request takes, from request,
   * through the server response, up until the actual page render completes.
   */
  browser_monitoring: {
    attributes: {
      /**
       * If `true`, the agent captures attributes from browser monitoring.
       *
       * @env NEW_RELIC_BROWSER_MONITOR_ATTRIBUTES
       */
      enabled: true,
      /**
       * Prefix of attributes to exclude from browser monitoring.
       * Allows * as wildcard at end.
       *
       * @env NEW_RELIC_BROWSER_MONITORING_ATTRIBUTES_EXCLUDE
       */
      exclude: [],
      /**
       * Prefix of attributes to include in browser monitoring.
       * Allows * as wildcard at end.
       *
       * @env NEW_RELIC_BROWSER_MONITORING_ATTRIBUTES_INCLUDE
       */
      include: [],
    },
    /**
     * Enable browser monitoring header generation.
     *
     * This does not auto-instrument, rather it enables the agent to generate headers.
     * The newrelic module can generate the appropriate <script> header, but you must
     * inject the header yourself, or use a module that does so.
     *
     * Usage:
     *
     *     var newrelic = require('newrelic');
     *
     *     router.get('/', function (req, res) {
     *       var header = newrelic.getBrowserTimingHeader();
     *       res.write(header)
     *       // write the rest of the page
     *     });
     *
     * This generates the <script>...</script> header necessary for Browser Monitoring
     * This script must be manually injected into your templates, as high as possible
     * in the header, but _after_ any X-UA-COMPATIBLE HTTP-EQUIV meta tags.
     * Otherwise you may hurt IE!
     *
     * This method must be called _during_ a transaction, and must be called every
     * time you want to generate the headers.
     *
     * Do *not* reuse the headers between users, or even between requests.
     *
     * @env NEW_RELIC_BROWSER_MONITOR_ENABLE
     */
    enable: true,
    /**
     * Request un-minified sources from the server.
     *
     * @env NEW_RELIC_BROWSER_MONITOR_DEBUG
     */
    debug: false,
  },
};
