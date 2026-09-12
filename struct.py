from pathlib import Path

project = Path("mouher-preview")

directories = [
    project / "src",
    project / "public" / "images",
]

files = [
    project / "src" / "App.jsx",
    project / "src" / "main.jsx",
    project / "src" / "index.css",
    project / "index.html",
    project / "package.json",
    project / "vite.config.js",
]

# Create directories
for directory in directories:
    directory.mkdir(parents=True, exist_ok=True)

# Create empty files
for file in files:
    file.touch(exist_ok=True)

print(f"Created project: {project.resolve()}")
print()

for path in sorted(project.rglob("*")):
    if path.is_dir():
        print(f"📁 {path.relative_to(project)}/")
    else:
        print(f"📄 {path.relative_to(project)}")