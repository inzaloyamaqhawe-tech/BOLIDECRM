from pathlib import Path
import re, shutil
p = Path(__file__).parent
config = p / "api/config.php"
if not config.exists():
    raise SystemExit("Create a private api/config.php before preparing the production upload folder.")
if '/crm/assets/' not in (p / 'dist/index.html').read_text(encoding='utf-8'):
    raise SystemExit("Build with BASE_PATH=/crm/ first.")
dest = p / 'deploy-crm'
dest.mkdir(exist_ok=True)
# Only remove obsolete generated files inside the verified upload assets directory.
assets = dest / 'assets'
if assets.exists():
    assert assets.resolve().is_relative_to(dest.resolve())
    for file in assets.iterdir():
        if file.is_file() and not (p / 'dist/assets' / file.name).exists():
            assert file.resolve().is_relative_to(assets.resolve())
            file.unlink()
shutil.copytree(p / 'dist', dest, dirs_exist_ok=True)
(dest / 'api').mkdir(exist_ok=True)
for name in ['.htaccess', '.user.ini', 'auth.php', 'state.php', 'session.php', 'db.php', 'health.php', 'import-functions.php', 'config.php']:
    shutil.copy2(p / 'api' / name, dest / 'api' / name)
match = re.search(r"'db_pass'\s*=>\s*'([^']*)'", config.read_text(encoding='utf-8'))
for file in (dest / 'assets').glob('*.js'):
    content = file.read_text(encoding='utf-8')
    if match and match.group(1):
        assert match.group(1) not in content, 'Database password found in public bundle'
assert (dest / '.htaccess').exists()
print('Individual upload folder ready:', dest)
