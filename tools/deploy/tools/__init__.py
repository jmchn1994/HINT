class MDConfig:
  """Config spec for HINT single experiment"""
  def __init__(self):
    self.sections = []

  def addSection(self, section):
    self.sections.append(section)
    return self

  def __str__(self):
    return '\n'.join([str(s) for s in self.sections])

class MDSection:
  def __init__(self, id, type):
    self.type = type
    self.id = id
    self.attributes = {}
    self.chunks = []

  def set(self, key, value):
    self.attributes[key] = value
    return self

  def addChunk(self, chunk):
    self.chunks.append(chunk)
    return self

  def __str__(self):
    lines = []
    # Insert the ID line
    if self.type == 'tutorial':
      lines.append(f'#? {self.id}')
    elif self.type == 'interstitial':
      lines.append(f'# {self.id}')
    else:
      lines.append(f'## {self.id}')

    # Write all the k-v pairs
    for k in self.attributes:
      if isinstance(self.attributes[k], list):
        flatlist = '\n'.join([f'- {item}' for item in self.attributes[k]])
        lines.append(f'{k}:\n{flatlist}\n')
      else:
        lines.append(f'{k}: {self.attributes[k]}\n')

    # Write any body chunks
    for chunk in self.chunks:
      for line in chunk:
        lines.append(f'> {line}')
      lines.append('')

    return '\n'.join(lines)
