# TravelGrid - Unified App (Backend API + Frontend)
# Uses Node.js LTS for a stable, production-ready runtime

FROM node:22-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy dependency manifests first (leverages Docker layer caching)
COPY services/itinerary-service/package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the backend service source files
COPY services/itinerary-service/ .

# Copy frontend static files into the public/ directory
COPY services/frontend/index.html ./public/index.html
COPY services/frontend/app.js ./public/app.js
COPY services/frontend/style.css ./public/style.css

# Set the application port
ENV PORT=8080

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
