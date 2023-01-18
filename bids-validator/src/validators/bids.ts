import { FileTree } from '../types/filetree.ts'
import { GenericSchema } from '../types/schema.ts'
import { walkFileTree } from '../schema/walk.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { applyRules } from '../schema/applyRules.ts'
import {
  checkDatatypes,
  checkLabelFormat,
  isAssociatedData,
  isTopLevel,
} from './filenames.ts'
import { filenameIdentify } from './filenameIdentify.ts'
import { filenameValidate } from './filenameValidate.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { ValidationResult } from '../types/validation-result.ts'
import { Summary } from '../summary/summary.ts'
import { CheckFunction } from '../types/check.ts'
import { emptyFile } from './internal/emptyFile.ts'

/**
 * Ordering of checks to apply
 */
const CHECKS: CheckFunction[] = [
  emptyFile,
  filenameIdentify,
  filenameValidate,
  applyRules,
]

/**
 * Full BIDS schema validation entrypoint
 */
export async function validate(fileTree: FileTree): Promise<ValidationResult> {
  const issues = new DatasetIssues()
  const summary = new Summary()
  const schema = await loadSchema()

  /* There should be a dataset_description in root, this will tell us if we
   * are dealing with a derivative dataset
   */
  const ddFile = fileTree.files.find(
    (file) => file.name === 'dataset_description.json',
  )
  let isDeriv
  if (ddFile) {
    const description = await ddFile.text().then((text) => JSON.parse(text))
    if (!'GeneratedBy' in description) {
      delete schema.rules.datatypes.derivatives
      isDeriv = false
    } else {
      isDeriv = true
    }
  }

  for await (const context of walkFileTree(fileTree, issues)) {
    // TODO - Skip ignored files for now (some tests may reference ignored files)
    if (context.file.ignored) {
      continue
    }

    /* new filename validation
    if (isAssociatedData(schema, context.file.path)) {
      continue
    }

    if (!isTopLevel(schema, context)) {
      checkDatatypes(schema, context)
      checkLabelFormat(schema, context)
    }
    */

    await context.asyncLoads()
    // Run majority of checks
    for (const check of CHECKS) {
      // TODO - Resolve this double casting?
      await check(schema as unknown as GenericSchema, context)
    }
    await summary.update(context)
  }

  return {
    issues,
    summary: summary.formatOutput(),
  }
}
