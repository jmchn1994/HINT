import os

from os.path import join, dirname, abspath, isdir, isfile

OUTFILE = join(dirname(abspath(__file__)),'index.html')

def read(base, filename):
  if filename[0] == '/':
    filename = filename[1:]
  path = os.path.join(base, filename)
  with open(path, 'r') as f:
    return f.read()

if __name__ == '__main__':
  import sys, re

  if len(sys.argv) < 2:
    print(f'Usage: {sys.argv[0]} [build-dir]')
    print('    Specify the build output directory to compile!');
    exit(1)

  with open(os.path.join(sys.argv[1], 'index.html'), 'r') as f:
    contents = f.read()
    css = [read(sys.argv[1], c)
      for c in re.findall(r'link href="(.+?)"', contents)]
    js = [read(sys.argv[1], c)
      for c in re.findall(r'script src="(.+?)"', contents)]
    rawJs = [c for c in re.findall(r'<script>(.+?)</script>', contents)]
    with open(OUTFILE, 'w') as g:
      for c in css:
        g.write(f'<style>{c}</style>\r\n');

      g.write('<div id="--task-config" style="display:none">${CONFIG}</div>\r\n')
      g.write('<noscript>You need to enable JavaScript to run this app.</noscript>\r\n')
      g.write('<div id="root"></div>\r\n')
      g.write('<input type="hidden" name="-fake-input"/>\r\n')
      g.write('<style>#mturk_form>p.text-center{display:none}</style>\r\n');

      for j in js + rawJs:
        g.write(f'<script>{j}</script>\r\n');

  print(f'Done! Found {len(js)} scripts {len(css)} css and {len(rawJs)} inset chunks!');
