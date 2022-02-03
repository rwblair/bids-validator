const rule_conditions = [
  {
    "conditions": {
      "datatype": "func"
    },
    "apply": [
      {
        "conditions": {
          "suffix": "bold",
          "ext": [".nii", ".nii.gz"],
          "use_as": "niiheader",
        },
        "requires": [
          {
            "ext": ".json",
            "use_as": "sidecar"
          }
        ],
        "apply": [0, 1]
      }
    ]
  }
]

const rules = [
  {
    "description": "imma rule",
    "assert": "sidecar.RepetitionTime == niiheader.pixdim[4]",
    "state": "error"
  },
  {
    "description": "imma rule",
    "assert": "sidecar.RepetitionTime",
    "state": "error"
  }
]
/*
{
  name: 'sub-16_task-balloonanalogrisktask_run-03_events.tsv',
  path: '/home/rwblair/projects/datasets/ds001/sub-16/func/sub-16_task-balloonanalogrisktask_run-03_events.tsv',
  relativePath: '/sub-16/func/sub-16_task-balloonanalogrisktask_run-03_events.tsv',
  entities: [Object: null prototype] {
    task: '_task-balloonanalogrisktask',
    acquisition: undefined,
    ceagent: undefined,
    reconstruction: undefined,
    direction: undefined,
    run: '_run-03',
    suffix: 'events',
    ext: '.tsv',
    datatype: 'func'
  }
}
*/

const entity_matrix = (fileList) => {
  entities = {}
  fileList.forEach(file => {
    if (!file.entities) {
      return
    }
    Object.keys(file.entities).forEach((key) => {
      if (!file.entities[key]) {
        return
      }
      if (!entities[key]) {
        entities[key] = {}
      }
      let entity_value = file.entities[key]
      if (!entities[key][entity_value]) {
        entities[key][entity_value] = [file.relativePath]
      } else {
        entities[key][entity_value].push(file.relativePath)
      }
    })
  })
  console.log(entities)
}

/* testing with just the func regex, embed the match groups from the regex
 * into the file object. We will use these match groups to check against the
 * conditions to see if a rule should be applied.
 */
export const silly = (files, schema) => {
  let fileList = Object.values(files)
  fileList.forEach((file) => {
    let matches = schema.datatypes['func'].map(x => x.exec(file.relativePath))
    matches = matches.filter(x => x)
    if (matches.length === 1) {
      matches = matches[0]
      file.entities = matches.groups
      file.entities['datatype'] = 'func'
    } else if (matches.length > 1) {
      // curious if this ever happens
      throw 'more than one match...'
    }
  })
  entity_matrix(fileList)
  let results = rule_conditions.flatMap((rule_condition) => {
    return match_rule_conditions(fileList, rule_condition)
  })
}

const match_rule_conditions = (fileList, rule_condition) => {
  const { conditions, apply, requires } = rule_condition

  /* Which files match at least one element from each of the path component
   *   arrays in conditions.
   */
  let newFileList = fileList.filter((file) => {
    if (!file.entities) {
      return false
    }
    let all_match = test_file_conditions(file, conditions)
    /* if we have a match, lets see if we have the required files */
    if (all_match && requires) {
      generate_required_files(file.relativePath, requires)      
    }
    return all_match
  })

  let rules_applied = apply.flatMap((rule) => {
    if (typeof(rule) === 'number') {
      console.log("we should apply a rule")
      return apply_rule(newFileList, rule)
    }
    else if (typeof(rule) === 'object' && 'conditions' in rule) {
      return match_rule_conditions(newFileList, rule)
    }
    return ['fall through']
  })
  return rules_applied
}

const test_file_conditions = (file, conditions) => {
  Object.keys(conditions).every((key) => {
    if (key === 'use_as') {
      return true
    }
    if (typeof(conditions[key]) === 'string') {
      conditions[key] = [conditions[key]]
    }
    return conditions[key].some(condition => {
      if (file.entities[key] === condition) {
        return true
      }
      return false
    })
  })
}

const apply_rule = (fileList, rule_number) => {
  fileList.map((file) => {
    // const context = build_context(....
    // apply_rule_to_context(context, ...
  })
}
