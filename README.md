# Cyril — Stage Test Specs

[![CI](https://github.com/Archimedean2/Cyril/actions/workflows/ci.yml/badge.svg)](https://github.com/Archimedean2/Cyril/actions/workflows/ci.yml)

## Purpose

This folder contains stage-specific test checklists.

These files are:
- human-readable
- agent-readable
- small enough for focused context windows

They are not executable tests.
They define what tests must exist and pass before a stage is considered complete.

## Status Fields

Each row includes:
- `Implemented`: test code exists
- `Passing`: test currently passes

A stage is not done until both are checked for all required tests.

## Workflow

For a given stage:
1. Read the corresponding stage file in this folder
2. Implement the listed test files
3. Check `Implemented`
4. Run the tests
5. Check `Passing`
6. Update `PROGRESS.md`

## Naming Convention

Stage files:
- `stage-0.md`
- `stage-1.md`
- ...
- `stage-13.md` — Concurrent Speakers (multi-column authoring mode)