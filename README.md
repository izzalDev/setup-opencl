# setup-opencl [![ts](https://github.com/izzal/setup-opencl/actions/workflows/ts.yaml/badge.svg)](https://github.com/izzal/setup-opencl/actions/workflows/ts.yaml)

GitHub Action to automatically install and configure OpenCL.

## Features

- Sets up OpenCL on Ubuntu (`ubuntu-latest`) and Windows (`windows-latest`).
- Automatically handles platform-specific installations (e.g., configuring `DEBIAN_FRONTEND` for Linux and downloading the Intel OpenCL runtime for Windows).

## Specification

To use this action, simply add it to your workflow:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: izzal/setup-opencl@v1
```

This action currently takes no inputs and provides no outputs. It will just install and configure the necessary OpenCL runtime on the system.

## Development

To develop and test this action locally:

```console
$ git clone https://github.com/izzal/setup-opencl.git

$ pnpm i
$ pnpm test
```

### Stable release

When you want to create a stable release, update the major version in the [release workflow](.github/workflows/release.yaml):

```yaml
      - uses: int128/release-typescript-action@v1
        with:
          major-version: 1
```

Then a new stable release (e.g., `v1.0.0`) will be created automatically.
