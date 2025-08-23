#!/usr/bin/env bash


rsync -aP --delete ~/vaults/sdb/dailies/ ~/code/altphi.github.io/content/notes/
rsync -aP --delete ~/vaults/clt/dailies/ ~/code/altphi.github.io/content/techne/
