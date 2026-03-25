# Use the lightweight Alpine Linux image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only the package files first (to cache the npm install step)
COPY package*.json ./

# Install ONLY production dependencies (ignores devDependencies like nodemon)
RUN npm install --omit=dev

# Copy the rest of your backend code
COPY . .

# Expose the port your Express server runs on
EXPOSE 5000

# Run the actual node server
CMD ["node", "src/server.js"]