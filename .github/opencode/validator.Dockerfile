FROM node:24-bookworm-slim@sha256:51b1100cc2a83d370c6a60952e3f2989c8a43159d0e38586e090f3b3326efefd
RUN npm install --global --ignore-scripts pnpm@10.17.1
ENV CI=true NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace
USER node
