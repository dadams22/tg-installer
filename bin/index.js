#!/usr/bin/env node
import cli from '../build/cli.js';

(async () => cli().then(() => console.log()))();