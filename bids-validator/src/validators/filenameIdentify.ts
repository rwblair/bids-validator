/*
 * filenameIdentify.ts attempts to determine which schema rules from
 * `schema.rules.files` might apply to a given file context by looking at the
 * files suffix then its location in the directory hierarchy, and finally at
 * its extensions and entities. Ideally we end up with a single rule to
 * validate against. We try to take as broad an approach to finding a single
 * file rule as possible to generate the most possible errors for incorrectly
 * named files. Historically a regex was applied that was pass/fail with
 * little in the way of feed back. This way we can say hey you got the suffix
 * correct, but the directory is slightly off, or some entities are missing,
 * or too many are there for this rule. All while being able to point at an
 * object in the schema for reference.
 */
// @ts-nocheck
import { SEP } from '../deps/path.ts'
import { GenericSchema, Schema } from '../types/schema.ts'
import { BIDSContext } from '../schema/context.ts'
import { lookupModality } from '../schema/modalities.ts'
import { CheckFunction } from '../types/check.ts'
import { lookupEntityLiteral } from './filenameValidate.ts'

const CHECKS: CheckFunction[] = [
  datatypeFromDirectory,
  findRuleMatches,
  hasMatch,
  cleanContext,
]

export async function filenameIdentify(schema, context) {
  for (const check of CHECKS) {
    await check(schema as unknown as GenericSchema, context)
  }
  return Promise.resolve()
}

async function findRuleMatches(schema, context) {
  let schemaPath = 'rules.files'
  Object.keys(schema[schemaPath]).map((key) => {
    const path = `${schemaPath}.${key}`
    _findRuleMatches(schema[path], path, context)
  })
  return Promise.resolve()
}

/* Schema rules specifying valid filenames follow a variety of patterns.
 * 'path', 'stem' or 'suffixies' contain the most unique identifying
 * information for a rule. We don't know what kind of filename the context is,
 * so if one of these three match the respective value in the context lets
 * assume that this schema rule is applicable to this file.
 */
function _findRuleMatches(node, path, context) {
  if (
    ('path' in node && context.file.name.endsWith(node.path)) ||
    ('stem' in node && context.file.name.startsWith(node.stem)) ||
    ('suffixes' in node && node.suffixes.includes(context.suffix))
  ) {
    context.filenameRules.push(path)
    return
  }
  if (
    !('path' in node || 'stem' in node || 'suffixes' in node) &&
    typeof node === 'object'
  ) {
    Object.keys(node).map((key) => {
      _findRuleMatches(node[key], `${path}.${key}`, context)
    })
  }
}

async function datatypeFromDirectory(schema, context) {
  const subEntity = schema.objects.entities.subject.name
  const subFormat = schema.objects.formats[subEntity.format]
  const sesEntity = schema.objects.entities.session.name
  const sesFormat = schema.objects.formats[sesEntity.format]
  const parts = context.file.path.split(SEP)
  let datatypeIndex = 2
  if (parts[0] !== '') {
    // we assume paths have leading '/'
  }
  // Ignoring associated data for now
  const subParts = parts[1].split('-')
  if (!(subParts.length === 2 && subParts[0] === subEntity)) {
    // first directory must be subject
  }
  if (parts.length < 3) {
    return Promise.resolve()
  }
  const sesParts = parts[2].split('-')
  if (sesParts.length === 2 && sesParts[0] === sesEntity) {
    datatypeIndex = 3
  }
  let dirDatatype = parts[datatypeIndex]
  for (let key in schema.rules.modalities) {
    if (schema.rules.modalities[key].datatypes.includes(dirDatatype)) {
      context.modality = key
      context.datatype = dirDatatype
      return Promise.resolve()
    }
  }
}

async function hasMatch(schema, context) {
  if (
    context.filenameRules.length === 0 &&
    context.file.path !== '/.bidsignore'
  ) {
    context.issues.addNonSchemaIssue('NOT_INCLUDED', [context.file])
  }

  /* we have matched multiple rules and a datatype, lets see if we have one
   *   rule with the same datatype, if so just use that one.
   */
  if (context.filenameRules.length > 1) {
    const datatypeMatch = context.filenameRules.filter((rulePath) => {
      if (Array.isArray(schema[rulePath].datatypes)) {
        return schema[rulePath].datatypes.includes(context.datatype)
      } else {
        return false
      }
    })
    if (datatypeMatch.length > 0) {
      context.filenameRules = datatypeMatch
    }
  }

  /* Filtering applicable rules based on datatypes failed, lets see if the
   * entities and extensions are enough to find a single rule to use.
   */
  if (context.filenameRules.length > 1) {
    const entExtMatch = context.filenameRules.filter((rulePath) => {
      return entitiesExtensionsInRule(schema, context, rulePath)
    })
    if (entExtMatch.length > 0) {
      context.filenameRules = [entExtMatch[0]]
    }
  }
  /* If we end up with multiple rules we should generate an error? */
  if (context.filenameRules.length > 1) {
  }

  return Promise.resolve()
}

/* Test if all of a given context's extension and entities are present in a
 * given rule. Only used to see if one rule is more applicable than another
 * after suffix and datatype matches couldn't find only one rule.
 */
function entitiesExtensionsInRule(
  schema: GenericSchema,
  context: BIDSContext,
  path: string,
): boolean {
  const rule = schema[path]
  const fileEntities = Object.keys(context.entities)
  const ruleEntities = Object.keys(rule.entities).map((key) =>
    lookupEntityLiteral(key, schema),
  )
  const extInRule =
    !rule.extensions ||
    (rule.extensions && rule.extensions.includes(context.extension))
  const entInRule =
    !rule.entities ||
    (rule.entities &&
      fileEntities.every((ent) => {
        return ruleEntities.includes(ent)
      }))
  return extInRule && entInRule
}

/* If none of the rules applicable to a filename use entities or what not,
 * lets remove them from the context so we don't trigger any unintended rules
 */
function cleanContext(schema, context) {
  const rules = context.filenameRules
    .map((path) => schema[path])
    [
      (['entities', 'entities', {}],
      ['extensions', 'extension', ''],
      ['suffixes', 'suffix', ''])
    ].map((part) => {
      if (
        rules.every(
          (rule) => !rule[part[0]] && Object.keys(rule[part[0]]).length === 0,
        )
      ) {
        context[part[1]] = part[2]
      }
    })
}
