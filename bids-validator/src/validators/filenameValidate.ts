import { CheckFunction, RuleCheckFunction } from '../types/check.ts'
import { BIDSContext } from '../schema/context.ts'
import { GenericSchema, Schema } from '../types/schema.ts'
import { SEP } from '../deps/path.ts'
import { hasProp } from '../utils/objectPathHandler.ts'

const sidecarExtensions = ['.json', '.tsv', '.bvec', '.bval']

const CHECKS: CheckFunction[] = [
  missingLabel,
  atRoot,
  entityLabelCheck,
  checkRules,
]

export async function filenameValidate(
  schema: GenericSchema,
  context: BIDSContext,
) {
  for (const check of CHECKS) {
    await check(schema, context)
  }
  return Promise.resolve()
}

export function isAtRoot(context: BIDSContext) {
  if (context.file.path.split(SEP).length !== 2) {
    return false
  }
  return true
}

async function missingLabel(schema: GenericSchema, context: BIDSContext) {
  const fileNoLabelEntities = Object.keys(context.entities).filter(
    (key) => context.entities[key] === 'NOENTITY',
  )

  const fileEntities = Object.keys(context.entities).filter(
    (key) => !fileNoLabelEntities.includes(key),
  )

  if (fileNoLabelEntities.length) {
    context.issues.addNonSchemaIssue('ENTITY_WITH_NO_LABEL', [
      { ...context.file, evidence: fileNoLabelEntities.join(', ') },
    ])
  }
  return Promise.resolve()
}

function atRoot(schema: GenericSchema, context: BIDSContext) {
  /*
  if (fileIsAtRoot && !sidecarExtensions.includes(context.extension)) {
    // create issue for data file in root of dataset
  }
  */
  return Promise.resolve()
}

export function lookupEntityLiteral(name: string, schema: GenericSchema) {
  if (
    schema.objects &&
    hasProp(schema.objects, 'entities') &&
    hasProp(schema.objects.entities, name)
  ) {
    const entityObj = schema.objects.entities[name]
    if (hasProp(entityObj, 'name')) {
      return entityObj.name
    }
  }
  // if this happens there is an issue with the schema?
  return ''
}

function getEntityByLiteral(fileEntity: string, schema: GenericSchema) {
  if (
    'entities' in schema.objects &&
    typeof schema.objects.entities === 'object'
  ) {
    const entities = schema.objects.entities
    const key = Object.keys(entities).find((key) => {
      return hasProp(entities, key) && entities[key].name === fileEntity
    })
    if (key && hasProp(entities, key)) {
      return entities[key]
    }
  }
  return null
}

async function entityLabelCheck(schema: GenericSchema, context: BIDSContext) {
  if (!('formats' in schema.objects) || !('entities' in schema.objects)) {
    throw new Error('schema missing keys')
  }
  const formats = schema.objects.formats
  const entities = schema.objects.entities
  Object.keys(context.entities).map((fileEntity) => {
    const entity = getEntityByLiteral(fileEntity, schema)
    if (
      entity &&
      entity.format &&
      typeof entity.format === 'string' &&
      hasProp(formats, entity.format)
    ) {
      // assuming all formats are well defined in schema.objects
      const pattern = formats[entity.format].pattern
      const rePattern = new RegExp(`^${pattern}$`)
      const label = context.entities[fileEntity]
      if (!rePattern.test(label)) {
        context.issues.addNonSchemaIssue('INVALID_ENTITY_LABEL', [
          {
            ...context.file,
            evidence: `entity: ${fileEntity} label: ${label} pattern: ${pattern}`,
          },
        ])
      }
    } else {
      // unknown entity
    }
  })
  return Promise.resolve()
}

const ruleChecks: RuleCheckFunction[] = [
  entityRuleIssue,
  datatypeMismatch,
  extensionMismatch,
]

async function checkRules(schema: GenericSchema, context: BIDSContext) {
  for (const path of context.filenameRules) {
    for (const check of ruleChecks) {
      check(path, schema as unknown as GenericSchema, context)
    }
  }
  return Promise.resolve()
}

function entityRuleIssue(
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) {
  const rule = schema[path]
  if (!('entities' in rule)) {
    if (Object.keys(context.entities).length > 0) {
      // Throw issue for entity in file but not rule
    }
    return
  }

  const fileEntities = Object.keys(context.entities)
  const ruleEntities = Object.keys(rule.entities).map((key) =>
    lookupEntityLiteral(key, schema),
  )

  // skip required entity checks if file is at root.
  // No requirements for inherited sidecars at this level.
  if (!isAtRoot(context)) {
    const ruleEntitiesRequired = Object.entries(rule.entities)
      .filter(([_, v]) => v === 'required')
      .map(([k, _]) => lookupEntityLiteral(k, schema))

    const missingRequired = ruleEntitiesRequired.filter(
      (required) => !fileEntities.includes(required as string),
    )

    if (missingRequired.length) {
      context.issues.addNonSchemaIssue('MISSING_REQUIRED_ENTITY', [
        {
          ...context.file,
          evidence: `${missingRequired.join(', ')} missing from rule ${path}`,
        },
      ])
    }
  }

  const entityNotInRule = fileEntities.filter(
    (fileEntity) => !ruleEntities.includes(fileEntity),
  )

  if (entityNotInRule.length) {
    context.issues.addNonSchemaIssue('ENTITY_NOT_IN_RULE', [
      {
        ...context.file,
        evidence: `${entityNotInRule.join(', ')} not in rule ${path}`,
      },
    ])
  }
}

function datatypeMismatch(
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) {
  const rule = schema[path]
  if (
    !!context.datatype &&
    Array.isArray(rule.datatypes) &&
    !rule.datatypes.includes(context.datatype)
  ) {
    context.issues.addNonSchemaIssue('DATATYPE_MISMATCH', [
      { ...context.file, evidence: `Datatype rule being applied: ${path}` },
    ])
  }
}

async function extensionMismatch(
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) {
  const rule = schema[path]
  if (
    Array.isArray(rule.extensions) &&
    !rule.extensions.includes(context.extension)
  ) {
    context.issues.addNonSchemaIssue('EXTENSION_MISMATCH', [
      { ...context.file, evidence: `Rule: ${path}` },
    ])
  }
}
