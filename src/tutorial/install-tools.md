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

| Package      | Version | Required | <select id="pkg-sel"><option value="apt">apt</option><option value="pm">pacman</option><option value="yum">yum</option><option value="hb">homebrew</option></select> | comment | 
|:------------:|:-------:|:--------:|:---------------:|:--------|
| absl         | latest  | YES      | <code pkg _apt_="libabsl-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| BISON        | latest  | NO       | <code pkg _apt_="libbison-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| BLAS         | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| Boost        | 1.56.0  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | COMPONENT *filesystem system* |
| Eigen3       | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| FLEX         | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| GTest        | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| Java         | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| JNI          | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| JPEG         | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| LAPACK       | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| Matlab       | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| MPI          | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| OpenCL       | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| OpenCV       | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| OpenMP       | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| PkgConfig    | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| PNG          | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| PythonInterp | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| Qt5          | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | COMPONENT *Core Xml Widgets* |
| R            | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| SWIG         | >= 3.0  | YES      | <code pkg _apt_="swig" _pm_="---" _yum_="---" _hb_="---" /> | |
| TCL          | 8.6     | YES      | [Manual Installation](#manual-installation-of-tcl)                   | |
| Threads      | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| TIFF         | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| X11          | latest  | YES      | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| yaml-cpp     | latest  | YES      | <code pkg _apt_="libyaml-cpp-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| ZLIB         | latest  | NO       | <code pkg _apt_="libxxx-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| glog         | latest  | NO       | <code pkg _apt_="libgoogle-glog-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| gflags       | latest  | NO       | <code pkg _apt_="libgflags-dev" _pm_="---" _yum_="---" _hb_="---" /> | |
| unwind       | latest  | NO       | <code pkg _apt_="libunwind-dev" _pm_="---" _yum_="---" _hb_="---" /> | |

<script type="module">
    function getEl(id) {
        return new Promise(res => {
            const el = document.getElementById(id)
            if (el) res(el)
            else setTimeout(async () => res(await getEl(id)), 200)
        })
    }

    function updatePkgContent(pkg) {
        for (const el of document.getElementsByTagName('code')) {
            if (el.getAttributeNames().includes('pkg'))
                el.innerText = el.getAttribute(`_${pkg}_`) || 'N/A'
        }
    }
    getEl('pkg-sel').then(selectEl => {
        selectEl.addEventListener('change', function() {
            updatePkgContent(selectEl.value);
        })
        selectEl.value = 'apt'
        setInterval(() => updatePkgContent(selectEl.value), 1000)
    })
</script>

### Manual Installation of `tcl`

1. Clone git repositary from [github.com/tcltk](https://github.com/tcltk/tcl/tree/core-8-6-branch) (version 8.6 spceifically)
1. Run the install scripts specified in its [documentations](https://www.tcl-lang.org/doc/howto/compile.html)