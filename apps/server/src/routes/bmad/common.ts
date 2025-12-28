/**
 * Common utilities for BMAD routes
 */

import { createLogger } from '@automaker/utils';
import { getErrorMessage as getErrorMessageShared, createLogError } from '../common.js';

const logger = createLogger('BMAD');

export { getErrorMessageShared as getErrorMessage };
export const logError = createLogError(logger);
