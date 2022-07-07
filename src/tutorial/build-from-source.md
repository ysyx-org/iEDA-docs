<script setup>
import { ref } from 'vue'
const
    [APT, YUM, PACMAN, HOMEBREW] = new Array(100).fill(0).keys(),
    pkgManager = ref(APT),
    options = ['APT', 'YUM', 'Pacman', 'HomeBrew']

function pkg(...packages) {
    return packages[pkgManager.value] || '-'
}
</script>

<style>
    select {
        font-size: inherit;
        font-family: 'Cascadia Code', 'Monaco', Monospace;
        color: inherit;
        border: none;
        text-align: center;
    }
    code[pkg] {
        display: inline-block;
        min-width: 5em;
    }
</style>

# Build from source

## Get the source code

*Source code is currently not available*

> **Notice**
> 
> You have to initiate and pull git submodules before compiling the project.
> 
> ```sh
> git submodule init && git submodule update
> ```

## Dependencies

In order to compile this project, the following libraries are required to be installed by the package manager of your OS.

| Package      | Ver.    | Required | <select v-model="pkgManager"><option v-for="(n, i) in options" :key="i" :value="i">{{ n }}</option></select> | comment | 
|:------------:|:-------:|:--------:|:-----------------:|:--------|
| absl         | latest  | YES      | <code pkg v-html="pkg('libabsl-dev')"  />     | |
| BISON        | latest  | NO       | <code pkg v-html="pkg('libbison-dev')" />    | |
| BLAS         | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| Boost        | 1.56.0  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | COMPONENT *filesystem system* |
| Eigen3       | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| FLEX         | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| GTest        | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| Java         | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| JNI          | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| JPEG         | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| LAPACK       | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| Matlab       | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| MPI          | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| OpenCL       | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| OpenCV       | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| OpenMP       | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| PkgConfig    | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| PNG          | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| PythonInterp | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| Qt5          | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | COMPONENT *Core Xml Widgets* |
| R            | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| SWIG         | >= 3.0  | YES      | <code pkg v-html="pkg('swig')"         />      | |
| TCL          | 8.6     | YES      | [Manual Installation](#manual-installation-of-tcl) | |
| Threads      | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| TIFF         | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| X11          | latest  | YES      | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| yaml-cpp     | latest  | YES      | <code pkg v-html="pkg('libyaml-cpp')"  />      | |
| ZLIB         | latest  | NO       | <code pkg v-html="pkg('libxxx-dev')"   />      | |
| glog         | latest  | NO       | <code pkg v-html="pkg('libgoogle-glog')"/>     | |
| gflags       | latest  | NO       | <code pkg v-html="pkg('libgflags-dev')"/>      | |
| unwind       | latest  | NO       | <code pkg v-html="pkg('libunwind-dev')"/>      | |

### Manual Installation of `tcl`

1. Clone git repositary from [github.com/tcltk](https://github.com/tcltk/tcl/tree/core-8-6-branch) (version 8.6 spceifically)
1. Run the install scripts specified in its [documentations](https://www.tcl-lang.org/doc/howto/compile.html)