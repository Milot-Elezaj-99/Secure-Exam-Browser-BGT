# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Copy and restore
COPY backend/*.csproj ./backend/
RUN dotnet restore ./backend/Backend.csproj

# Copy everything else and build
COPY backend/ ./backend/
WORKDIR /source/backend
RUN dotnet publish -c Release -o /app

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# Render uses $PORT
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "Backend.dll"]
