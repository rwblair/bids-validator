import { BIDSContext, BIDSContextDataset } from './context.ts'
import { FileTree } from '../types/filetree.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'

/** Recursive algorithm for visiting each file in the dataset, creating a context */
export async function* _walkFileTree(
  fileTree: FileTree,
  root: FileTree,
  issues: DatasetIssues,
  dsContext?: BIDSContextDataset,
): AsyncIterable<BIDSContext> {
  for (const file of fileTree.files) {
    yield new BIDSContext(root, file, issues, dsContext)
  }
  for (const dir of fileTree.directories) {
    yield* _walkFileTree(dir, root, issues, dsContext)
  }
}

/** Walk all files in the dataset and construct a context for each one */
export async function* walkFileTree(
  fileTree: FileTree,
  issues: DatasetIssues,
  dsContext?: BIDSContextDataset,
): AsyncIterable<BIDSContext> {
  yield* _walkFileTree(fileTree, fileTree, issues, dsContext)
}
