# CLAUDE.md

Instructions for Claude Code when working with this repository.

## 🚨 MANDATORY WORKFLOW - EVERY CHANGE 🚨

**Follow this checklist for EVERY code change, no exceptions:**

### Required Steps
1. **UPDATE SPEC FIRST** - Find and update the relevant spec file before coding
2. **IMPLEMENT** - Make code changes according to the updated spec
3. **TEST** - Verify changes work correctly
4. **COMMIT** - Create atomic git commit with descriptive message
5. **NEVER SKIP STEPS** - Complete all steps before moving to next task

### Commit Rules
- One feature/fix = one commit
- Maximum 500 lines per commit (excluding generated files)
- Commit message must include: what changed + why
- Always verify changes work before committing

### Important
- Specs drive implementation - update them FIRST
- Never group unrelated changes
- Never skip commits between features
- If user's request affects specs, update them

## Testing & Debugging

### Development Commands
```bash
npm run dev                # Keyboard Playground (port 3000)
npm run dev:eyetracking    # Face Tracking POC (port 3001)
npm run dev:integrated     # Integrated Experience (port 3002)
npm run dev:handtracking   # Hand Tracking POC (port 3003)
```

### Required Testing
- Test with actual typing to ensure smooth rapid keypresses
- Monitor for audio timing conflicts (<50ms latency)
- Check animation performance (60+ FPS)
- Verify changes work in Electron window before committing
- Test edge cases: sustained typing, rapid keypresses, special characters

### Debug Workflow
1. Make changes
2. Test in running Electron app (auto-reloads via Parcel)
3. Use browser DevTools in Electron for debugging
4. Verify no console errors
5. Check performance metrics match requirements

## Project Context
Claude should read the relevant spec files in the project to understand:
- Architecture and technical requirements
- Feature specifications
- Design patterns and conventions

Spec files contain the authoritative project documentation.

### Key Specifications
- `specs/keyboard-playground-spec.md` - Main emoji playground with keyboard integration
- `specs/eye-tracking-spec.md` - Eye/gaze tracking with focus-based calibration
- `specs/hand-tracking-spec.md` - Hand gesture recognition and tracking
- `specs/integrated-experience-spec.md` - Multi-modal tracking integration