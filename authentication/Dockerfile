# Base image
FROM node:20

# Set working directory
WORKDIR /authentication

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

#RUN apt-get update && apt-get install -y mariadb-client

# Copy all backend files
COPY . .
# Expose the backend port
EXPOSE 4001

# Start the backend (modify this if you use a specific startup file like index.js)
CMD ["node", "index.js"]
