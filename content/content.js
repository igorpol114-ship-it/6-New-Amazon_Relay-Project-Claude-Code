logger.log('content', 'extension loaded', { version: EXT_VERSION });

// Self-test: verify all 4 log levels are visible in the console
logger.log('selftest', 'LOG level works');
logger.warn('selftest', 'WARN level works');
logger.error('selftest', 'ERROR level works', { context: 'selftest', guardedSelectors: FORBIDDEN_SELECTORS.length });
logger.debug('selftest', 'DEBUG level works', { debugLevel: DEBUG_LEVEL });
