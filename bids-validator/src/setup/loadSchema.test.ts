import { assert, assertObjectMatch } from '../deps/asserts.ts'
import { loadSchema } from './loadSchema.ts'

Deno.test('schema yaml loader', async (t) => {
  await t.step('reads in top level files document', async () => {
    const schemaDefs = await loadSchema()
    // Look for some stable fields in top level files
    if (
      typeof schemaDefs.rules.top_level_files === 'object' &&
      schemaDefs.rules.files.common.core !== null
    ) {
      const top_level = schemaDefs.rules.common.core as Record<string, any>
      if (top_level.hasOwnProperty('README')) {
        assertObjectMatch(top_level.README, {
          required: true,
          stem: 'README',
          extensions: ['', '.md', '.rst', '.txt'],
        })
      }
    } else {
      assert(false, 'failed to test schema defs')
    }
  })
  await t.step('loads all schema files', async () => {
    const schemaDefs = await loadSchema()
    if (
      !(typeof schemaDefs.objects === 'object') ||
      !(typeof schemaDefs.rules === 'object')
    ) {
      assert(false, 'failed to load objects/rules')
    }
  })
})
