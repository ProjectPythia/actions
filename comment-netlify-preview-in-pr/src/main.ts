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

    await core.group('Event payload...', async () => {
      core.info(JSON.stringify(event))
    })

    let foundPR = false
    let pullRequestNumber: number | undefined = undefined
    let pullRequestHeadSHA: string | undefined = undefined
    const pullRequests = await octokit.pulls.list({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    })

    for (let pr of pullRequests.data) {
      if (pr.head.sha === event.workflow_run.head_commit.id) {
        foundPR = true
        pullRequestHeadSHA = pr.head.sha
        pullRequestNumber = pr.number
        break
      }
    }

    if (foundPR === false) {
      core.info(
        `No pull request associated with git commit SHA: ${event.workflow_run.head_commit.id}`,
      )
      process.exit(0)
    }

    const message = `🚀 📚 Preview for git commit SHA: ${pullRequestHeadSHA} at: ${inputs.deployUrl}`

    if (typeof pullRequestNumber === 'number') {
      await octokit.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: pullRequestNumber,
        body: message,
      })
    }
  } catch (error) {
    core.info('Unable to post comment.')
    throw error
  }
}

run()
