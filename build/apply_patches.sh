#!/bin/bash
set -e

ROOT_DIR=`dirname "$0"`/../.. # root directory of v8, v8-i18n, and ICU
ROOT_DIR=`cd ${ROOT_DIR} && pwd`
V8_I18N_DIR=${ROOT_DIR}/v8-i18n

cd ${ROOT_DIR}/icu
patch -p0 < ${V8_I18N_DIR}/build/icu.patch

cd ${ROOT_DIR}/v8
patch -p0 < ${V8_I18N_DIR}/build/v8.patch
