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

/* Playing wtih other ways to organize fileList
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
        entities[key][entity_value] = [file]
      } else {
        entities[key][entity_value].push(file)
      }
    })
  })
}
*/

var master_filesList;

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
  master_filesList = fileList
  let results = rule_conditions.flatMap((rule_condition) => {
    return match_rule_conditions(fileList, rule_condition)
  })
}

const generate_required_files = (file, requires) => {
  required_context = {}
  requires.map(require => {
    let required_file = file.relativePath
    let use_as = require.use_as
    Object.keys(require).map(key => {
      if (key === 'use_as') {
        return
      }
      required_file = required_file.replace(file.entities[key], require[key])
    })
    if (use_as) {
      required_context[use_as] = required_file
    }
  })
  return required_context
}

/* for a given level of rule condition, find the files that the condition
 * applies to and collect the files listed as requirements for it.
 * if the apply part of the  rule-condition is a leaf then apply the rule listed,
 * otherwise recurse down into the apply object.
 */
const match_rule_conditions = (fileList, rule_condition) => {
  const { conditions, apply, requires } = rule_condition

  /* Which files match at least one element from each of the path component
   *   arrays in conditions.
   */
  let newFileList = []
  fileList.map((file) => {
    if (!file.entities) {
      return false
    }
    let all_match = test_file_conditions(file, conditions)
    if (!all_match) {
      return
    }
    let context = {}
    context = {...file}
    if (conditions.use_as) {
      context[conditions.use_as] = file
    }
    if (all_match && requires) {
      context = {...context, ...generate_required_files(file, requires)}
    }
    newFileList.push(context)
    return
  })

  let rules_applied = apply.flatMap((rule) => {
    if (typeof(rule) === 'number') {
      console.log("we should apply a rule")
      return apply_rule(newFileList, rule, requires)
    }
    else if (typeof(rule) === 'object' && 'conditions' in rule) {
      return match_rule_conditions(newFileList, rule)
    }
    return ['fall through']
  })
  return rules_applied
}

// compare object with conditions on path components against a specific file.
const test_file_conditions = (file, conditions) => {
  return Object.keys(conditions).every((key) => {
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
    console.log(file)
    console.log(rules[rule_number])
    // const context = build_context(....
    // apply_rule_to_context(context, ...
  })
}
