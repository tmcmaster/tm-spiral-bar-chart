#!/bin/bash

polymer build
rsync -a --delete build/default/ docs/
