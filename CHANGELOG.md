# Changelog

All notable changes to Issue Lens will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-02-01

### Fixed
- Fixed slow button injection - now appears within 1-2 seconds instead of 2 minutes
- Improved GitHub toolbar detection with multiple fallback selectors
- Decoupled button injection from data loading for faster initial render
- Optimized label/assignee extraction to load cached data immediately while fetching fresh data in background

### Changed
- Improved UI responsiveness on smaller screens
- Enhanced label selection interface with scrollable area

## [0.1.0] - 2026-02-01

### Added
- Initial public release
- GitHub Issues page integration
- Filter panel with slide-out drawer design
- Support for Firefox browsers
- Extension icons in multiple sizes (16, 32, 48, 96, 128px)
- Privacy-focused design with no data collection

### Technical
- Built with WXT framework
- React 19 + TypeScript
- Tailwind CSS for styling
- Radix UI primitives
- Lucide icons

---

## Version Guidelines

- **MAJOR** version - Incompatible API changes or major feature removals
- **MINOR** version - New functionality in a backwards compatible manner
- **PATCH** version - Backwards compatible bug fixes

## Release Checklist

Before each release:
- [ ] Update version in `package.json`
- [ ] Update this CHANGELOG with new version and date
- [ ] Test on Firefox
- [ ] Create git tag: `git tag -a v0.1.1 -m "Release version 0.1.1"`
- [ ] Push tag: `git push origin v0.1.1`
- [ ] Build: `bun run zip:firefox`
- [ ] Submit to Firefox Add-ons
- [ ] Add release notes in AMO dashboard


