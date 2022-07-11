# Report Data Generation
This code generates the `data.json` file used in reports.

To generate, save the mturk exported results in `mturkdir` then run
```
python export.py mturkdir [system_name] [condition_name]
```

Example: To generate the output for search-hhll (high high low low pattern),
the command would be `python export.py mturkdir search full,full,alt,alt`

Pattern names used in experiments:
- `full`: Base AI being tested
- `alt`: Alternative configuration being tested

## Creating Comparative Reports
To create comparative reports, it is possible to merge 2 `data.json` files.
Merge all JSON `"series"` items from data files by concatenating the lists from
each report, adding `"group": "A"` or `"group": "B"` to each record to indicate
which report it came from.


## Notebooks
The various notebooks are included for our analysis exploration. Feel free to
reference them to build your own analysis tools independent of the report.

Note: Internally our `event` condition is referenced as `commitment`.
