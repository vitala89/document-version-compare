// Blocks agent edits to the given fixtures in data/. Exit code 2 = deny, stderr goes to the agent.
let input = ''
for await (const chunk of process.stdin) input += chunk
const filePath = JSON.parse(input || '{}').tool_input?.file_path ?? ''
if (/[\\/]data[\\/]v\d+\.json$/.test(filePath)) {
  console.error('data/v*.json are the fixtures from the brief. Do not edit them; change the code instead.')
  process.exit(2)
}
