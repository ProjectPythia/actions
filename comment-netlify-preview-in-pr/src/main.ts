import * as github from '@actions/github'
import * as core from '@actions/core'
import * as fs from 'fs'

interface IActionInputs {
  readonly deployUrl: string
  readonly token: string
}

async function parseInputs(): Promise<IActionInputs> {
  try {
    const inputs: IActionInputs = Object.freeze({
      token: core.getInput('github-token', { required: true }),
      deployUrl: core.getInput('deploy-url', { required: true }),
    })
    return inputs
  } catch (error) {
    throw error
  }
}

async function run(): Promise<void> {
  try {
    const inputs = await core.group('Gathering inputs ...', parseInputs)
    const eventPath: string = process.env.GITHUB_EVENT_PATH as string
    const octokit = github.getOctokit(inputs.token)
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf-8'))
    const pullRequests = event.workflow_run.pull_requests
    let prNumber: number | undefined
    for (let pr of pullRequests) {
      if (pr.head.sha === event.workflow_run.head_commit.id) {
        prNumber = pr.number
        break
      }

      if (prNumber === undefined) {
        core.info(
          `No pull request associated with git commit SHA: ${event.workflow_run.head_commit.id}`
        )
        process.exit(0)
      }

      octokit.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        body: inputs.deployUrl,
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
