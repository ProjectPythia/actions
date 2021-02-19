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
    core.info(error.message)
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
    let foundPR = false
    let pull_request
    for (let pr of pullRequests) {
      if (pr.head.sha === event.workflow_run.head_commit.id) {
        foundPR = true
        pull_request = pr
        break
      }
    }

    if (foundPR === false) {
      core.info(
        `No pull request associated with git commit SHA: ${event.workflow_run.head_commit.id}`
      )
      process.exit(0)
    }

    const message = `🚀 📚 Preview for git commit SHA: ${pull_request.head.sha} at: ${inputs.deployUrl}`

    await octokit.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pull_request.number,
      body: message,
    })
  } catch (error) {
    core.info('Unable to post comment.')
    core.setFailed(error.message)
  }
}

run()
