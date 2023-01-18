// ESM import for yargs does not work for mysterious reasons
import { yargs } from '../deps/yargs.ts'

export interface ValidatorOptions {
  _: string[]
  config: any
  schema: any
  schemaOnly: boolean
  json: boolean
}

/**
 *
 * @param argumentOverride
 * @returns {void}
 */
export function parseOptions(
  argumentOverride: any[] | undefined = undefined,
): ValidatorOptions {
  return yargs(argumentOverride)
    .usage('Usage: $0 <dataset_directory> [options]')
    .help('help')
    .alias('help', 'h')
    .version('TODO: make version work in Deno')
    .alias('version', 'v')
    .demand(1, 1)
    .boolean('ignoreWarnings')
    .describe('ignoreWarnings', 'Disregard non-critical issues')
    .boolean('ignoreNiftiHeaders')
    .describe(
      'ignoreNiftiHeaders',
      'Disregard NIfTI header content during validation',
    )
    .boolean('ignoreSubjectConsistency')
    .describe(
      'ignoreSubjectConsistency',
      'Skip checking that any given file for one subject is present for all other subjects.',
    )
    .boolean('verbose')
    .describe('verbose', 'Log more extensive information about issues')
    .boolean('json')
    .describe('json', 'Output results as JSON')
    .boolean('no-color')
    .describe('no-color', 'Disable colors in output text.')
    .default('no-color', false)
    .boolean('ignoreSymlinks')
    .describe(
      'ignoreSymlinks',
      'Skip any symlinked directories when validating a dataset',
    )
    .boolean('remoteFiles')
    .describe('remoteFiles', 'Validate remote files.')
    .default('remoteFiles', false)
    .boolean('gitTreeMode')
    .describe(
      'gitTreeMode',
      'Improve performance using git metadata. Does not capture changes not known to git.',
    )
    .option('gitRef', {
      describe:
        'Targets files at a given branch, tag, or commit hash. Use with --gitTreeMode.  [default: "HEAD"]',
      type: 'string',
    })
    .implies('gitRef', 'gitTreeMode')
    .option('config', {
      alias: 'c',
      describe:
        'Optional configuration file. See https://github.com/bids-standard/bids-validator for more info',
      default: '.bids-validator-config.json',
    })
    .boolean('filenames')
    .default('filenames', false)
    .describe(
      'filenames',
      'A less accurate check that reads filenames one per line from stdin.',
    )
    .hide('filenames')
    .boolean('schemaOnly')
    .default('schemaOnly', false)
    .describe('schemaOnly', 'Run only schema based validation.')
    .epilogue(
      'This tool checks if a dataset in a given directory is \
compatible with the Brain Imaging Data Structure specification. To learn \
more about Brain Imaging Data Structure visit http://bids.neuroimaging.io',
    )
    .parseSync()
}
