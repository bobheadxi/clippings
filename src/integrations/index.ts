import Instapaper from 'src/integrations/instapaper';
import Markdown from 'src/integrations/markdown';

/**
 * List of enabled integrations that the plugin loads.
 */
export const integrationsRegistry = [Instapaper, Markdown];
