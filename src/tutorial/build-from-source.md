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

| Package      | Ver.    | Required | APT Alias         | comment | 
|:------------:|:-------:|:--------:|:-----------------:|:--------|
| absl         | latest  | YES      | `libabsl-dev`     | |
| BISON        | latest  | NO       | `libbison-dev`    | |
| BLAS         | latest  | NO       | `libxxx-dev`      | |
| Boost        | 1.56.0  | YES      | `libxxx-dev`      | COMPONENT *filesystem system* |
| Eigen3       | latest  | YES      | `libxxx-dev`      | |
| FLEX         | latest  | NO       | `libxxx-dev`      | |
| GTest        | latest  | YES      | `libxxx-dev`      | |
| Java         | latest  | YES      | `libxxx-dev`      | |
| JNI          | latest  | YES      | `libxxx-dev`      | |
| JPEG         | latest  | YES      | `libxxx-dev`      | |
| LAPACK       | latest  | NO       | `libxxx-dev`      | |
| Matlab       | latest  | NO       | `libxxx-dev`      | |
| MPI          | latest  | YES      | `libxxx-dev`      | |
| OpenCL       | latest  | YES      | `libxxx-dev`      | |
| OpenCV       | latest  | NO       | `libxxx-dev`      | |
| OpenMP       | latest  | YES      | `libxxx-dev`      | |
| PkgConfig    | latest  | NO       | `libxxx-dev`      | |
| PNG          | latest  | NO       | `libxxx-dev`      | |
| PythonInterp | latest  | NO       | `libxxx-dev`      | |
| Qt5          | latest  | YES      | `libxxx-dev`      | COMPONENT *Core Xml Widgets* |
| R            | latest  | NO       | `libxxx-dev`      | |
| SWIG         | >= 3.0  | YES      | `swig`            | |
| TCL          | 8.6     | YES      | [Manual Installation](#manual-installation-of-tcl) | |
| Threads      | latest  | YES      | `libxxx-dev`      | |
| TIFF         | latest  | NO       | `libxxx-dev`      | |
| X11          | latest  | YES      | `libxxx-dev`      | |
| yaml-cpp     | latest  | YES      | `libyaml-cpp`     | |
| ZLIB         | latest  | NO       | `libxxx-dev`      | |
| glog         | latest  | NO       | `libgoogle-glog`  | |
| gflags       | latest  | NO       | `libgflags-dev`   | |
| unwind       | latest  | NO       | `libunwind-dev`   | |

### Manual Installation of `tcl`

1. Clone git repositary from [github.com/tcltk](https://github.com/tcltk/tcl/tree/core-8-6-branch) (version 8.6 spceifically)
1. Run the install scripts specified in its [documentations](https://www.tcl-lang.org/doc/howto/compile.html)