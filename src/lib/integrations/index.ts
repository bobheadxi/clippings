import Instapaper from 'src/lib/integrations/instapaper';
import Markdown from 'src/lib/integrations/markdown';

/**
 * List of enabled integrations that the plugin loads.
 */
export const integrationsRegistry = [Instapaper, Markdown];
