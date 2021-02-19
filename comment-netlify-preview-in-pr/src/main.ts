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
    const event = fs.readFileSync(eventPath, 'utf-8')
    core.info(event)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
