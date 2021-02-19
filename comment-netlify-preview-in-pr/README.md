# `comment-netlify-preview-in-pr` Action

This GitHub Action posts a comment on a pull rquest with the netlify URL preview. It is intended to be used in conjuction with [nwtgck/actions-netlify](https://github.com/nwtgck/actions-netlify) in order to circumvent the GitHub secrets sharing issue that prohibits pull requests from forks from accessing secrets defined in base repository (see [this post](https://github.blog/2020-08-03-github-actions-improvements-for-fork-and-pull-request-workflows/)).

## Usage

```yaml
name: preview-book
on:
  workflow_run:
    workflows:
      - deploy-book
    types:
      - completed
jobs:
  deploy:
    if: github.repository == 'ProjectPythia/pythia-foundations'
    runs-on: ubuntu-latest
    defaults:
      run:
        shell: bash
    steps:
      - uses: actions/checkout@v2
      - name: Download Artifact Book
        uses: dawidd6/action-download-artifact@v2.9.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          workflow: deploy.yaml
          run_id: ${{ github.event.workflow_run.id }}
          name: book-zip
      - name: Unzip book
        run: |
          rm -rf ./_build/html
          unzip book.zip
          rm -f book.zip
      - name: Deploy to Netlify
        id: netlify
        uses: nwtgck/actions-netlify@v1.1.13
        with:
          publish-dir: ./_build/html
          production-deploy: false
          github-token: ${{ secrets.GITHUB_TOKEN }}
          enable-commit-comment: false
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        timeout-minutes: 5
      - name: Jupyter Book Preview
        uses: ProjectPythia/actions/comment-netlify-preview-in-pr@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-url: ${{ steps.netlify.outputs.deploy-url }}
```
