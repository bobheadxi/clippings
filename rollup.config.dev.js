import rollupConfig from './rollup.config.js';
import path from 'path';
import fs from 'fs';
import manifest from './manifest.json' assert { type: "json" };

const manifestPath = 'manifest.json';

const vaultPath = process.env.VAULT_PATH;
if (vaultPath) {
    const pluginID = `${manifest.id}-dev`
    rollupConfig.output.dir = path.join(vaultPath, '.obsidian', 'plugins', pluginID);
    console.log(`Building to ${rollupConfig.output.dir}`);
    if (!fs.existsSync(rollupConfig.output.dir)) {
        fs.mkdirSync(rollupConfig.output.dir);
    }
    const devManifest = Object.assign({}, manifest);
    devManifest.id = pluginID;
    devManifest.name = `${manifest.name} (dev version)`;
    devManifest.version = `${manifest.version}+${new Date().toISOString()}`;
    fs.writeFileSync(path.join(rollupConfig.output.dir, manifestPath), JSON.stringify(devManifest));
} else {
    console.log(`No VAULT_PATH provided, building to ${rollupConfig.output.dir}`);
}

export default rollupConfig;
