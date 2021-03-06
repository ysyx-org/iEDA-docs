# TCL 交互命令
iEDA支持TCL命令交互方式，通过Linux系统终端输入TCL命令，可以进行数据操作、功能运行、状态查询等多种交互，如果想使用TCL交互方式，参考如下流程

### TCL交互步骤

#### Step 1 开启TCL命令

首先，需要将流程配置文件flow_config.json的“Tools”-“TCL”选项设置为“ON”的状态，开启TCL交互模式。

#### Step 2 启动iEDA

进入iEDA程序目录，输入./iEDA，运行iEDA。

#### Step 3 输入TCL命令

iEDA程序启动后，可输入各个点工具和模块的TCL命令进行交互，详细的交互命令请参考各个点工具、模块TCL命令。

### TCL命令清单

#### iDB

| TCL命令      | 参数    | 参数说明                                            |
| ------------ | ------- | --------------------------------------------------- |
| idb_init     | -config | 读取config路径指定的json配置文件，初始化iDB数据     |
| lef_init     | -path   | 读取path路径指定的LEF文件列表，初始化iDB Tech数据   |
| def_init     | -path   | 读取path路径指定的DEF文件，初始化iDB Design数据     |
| verilog_init | -path   | 读取path路径指定的verilog文件，初始化iDB Design数据 |
| def_save     | -path   | 保存当前设计的DEF文件到path指定路径                 |

#### iFP

| TCL命令       | 参数    | 参数说明                                                                                             |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| run_floorplan | -config | 读取config文件路径的Floorplan配置参数，运行iFP点工具                                                 |
| 其他命令      |         | 请参考iFP软件设计说明书[1.4使用说明](https://e.gitee.com/i-eda/docs/969974/file/2640454?sub_id=5621175) |

#### iPL

| TCL命令    | 参数    | 参数说明                                         |
| ---------- | ------- | ------------------------------------------------ |
| run_placer | -config | 读取config文件路径的Place配置参数，运行iPL点工具 |

#### iCTS

| TCL命令 | 参数    | 参数说明                                        |
| ------- | ------- | ----------------------------------------------- |
| run_cts | -config | 读取config文件路径的CTS配置参数，运行iCTS点工具 |

#### iRT

| TCL命令    | 参数    | 参数说明                                          |
| ---------- | ------- | ------------------------------------------------- |
| run_router | -config | 读取config文件路径的Router配置参数，运行iRT点工具 |

#### iDRC

| TCL命令 | 参数    | 参数说明                                                       |
| ------- | ------- | -------------------------------------------------------------- |
| run_drc | -config | 读取config文件路径的DRC配置参数，运行iDRC点工具（检测DEF文件） |

#### iGUI

| TCL命令   | 参数 | 参数说明         |
| --------- | ---- | ---------------- |
| gui_start |      | 启动iEDA GUI界面 |
