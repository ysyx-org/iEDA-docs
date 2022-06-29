---
author: 黄增荣
audition: iEDA 课题组
history:
  - version: 0.10
    date: 2022-05-23
    author: Yell
    description: 设计说明初稿
---

# iDB - 数据库

## 1. 简介

iDB是iEDA基础数据库，实现了从LEF、DEF、Verilog网表文件等EDA设计文件中解析、存储数据，构建iEDA实现物理后端设计流程所需要的基础数据结构，保证了芯片物理后端设计的数据统一性。

在iEDA整个程序运行周期内都有且仅有一份统一的数据库存在，支持各个点工具和子模块的数据输入、结果输出。iEAD各个点工具和子模块从iDB中获取程序运行所需的数据并构建各自的模块数据库，并根据Flow控制的流程顺序将运行结果更新到iDB提供给后面流程使用。

### 1.1 设计需求和目标

iDB为解决iEDA对文件解析、程序数据处理、数据构建等需求而存在，具体如下：

* 文件解析：支持LEF、DEF、Verilog、GDSII等格式文件解析、存储；
* 数据结构：支持一套统一的基础数据结构，提供给各个点工具、子模块运行时使用；
* 数据构建：提供iEDA各个业务数据属性的增删改查接口；
* 数据处理：支持跨点工具、跨模块的数据交互处理；提供指定业务流程需求的数据处理API；
* 内存管理：应设计一套良好、高效的数据结构内存管理方案，降低内存占用和碎片化，保障数据处理过程的内存安全，提高存储效率；
* 数据管理：提供各个业务模块的数据管理功能（Instance、Net等业务级别的数据管理）。

### 1.2 专有名词

| **名词** | **解释** |
| -------------- | -------------- |
|                |                |
|                |                |
|                |                |
|                |                |
|                |                |
|                |                |

### 1.3 参考文档

> 格式为    方法关键词：对应方法的论文标题

### 1.4 使用说明

iDB提供TCL交互方式，具体的命令请查看[iEDA-TCL手册](https://e.gitee.com/i-eda/docs/969974/file/2640454?sub_id=5637877)。

后续持续补充扩展TCL接口 get_data set_data的交互功能。

## 2. 整体设计

### 2.1 总体架构

 ![图片.png](https://images.gitee.com/uploads/images/2022/0526/173924_9295c085_1737075.png)

*图2.1 iEDA数据库总体框架图*

图2.1是iEDA整体数据库管理框架图，iDB在此框架中处于**底层数据库**的角色，为上层应用提供数据接口。

![图片.png](https://images.gitee.com/uploads/images/2022/0526/155002_1090f024_1737075.png)

<img src="https://images.gitee.com/uploads/images/2022/0526/155002_1090f024_1737075.png" alt="6" style="zoom:70%;" />

*图2.2 iDB整体架构图*

iDB通过调用各个第三方文件解析器，将解析出来的各类数据通过Builder二次构建，封装到iDB的数据结构中，提供给iDM进行数据管理。

目前可以支持的数据文件类型有DEF、LEF、Verilog文件，其他文件类型将持续集成。

### 2.2 软件流程

描述软件的总体处理流程，**用文字描述清楚整个运行过程，并附上相应的代码**
![图片.png](https://images.gitee.com/uploads/images/2022/0526/120321_6a7179dc_1737075.png)

图2.2 iDB数据处理流程图

### 2.3 子模块设计

> *描述软件的各个组成子模块的设计，独立完成功能，相互依赖关系等。这些模块的情况*

#### 2.3.1 LEF Builder

#### 2.3.2 DEF Builder

#### 2.3.3 Verilog Builder

#### 2.3.4 Data Builder

### 2.4 评价指标

* 数据结构设计 良好的数据结构设计，模块解耦、可读性强、调用方便；
* 数据准确性 解析各类数据格式文件必须保证准确性；
* 接口 API的设计须满足可读性良好、定义清晰、外部参数最小化，满足低耦合、高内聚原则；
* 内存 以尽可能小的内存开销满足数据访问、数据处理等程序运行需求；
* 访问效率 提供经可能高的数据访问、处理的性能。

### 2.5 算法设计

> *描述软件用到的主要算法，可以用伪代码的形式描述。*

### 2.6 数据结构设计

> *描述用到的主要数据结构，包括类的设计，继承关系等等*

iDB主要是基于Cadence公司的DEF和LEF数据规范文档（LEF/DEF 5.8 Language Reference， Product Version 5.8）设计的数据结构，构建的数据存储在两大数据结构里面 ，具体如下：

IdbLayout：存储Tech数据，存储在P&R设计流程中固化的数据结构。

IdbDesign：存储P&R相关的设计数据，主要针对各个子工具和模块运行动态修改的数据。

2.6.1 IdbLayout

存储Tech数据，存P&R设计流程中固化的数据结构，也就是在各个子工具和模块中不再变化的数据。
![图片.png](https://images.gitee.com/uploads/images/2022/0526/164212_8de1e190_1737075.png)

2.6.2 IdbDesign

存储P&R相关的设计数据，主要包括各个子工具和模块中动态变化的数据。
![图片.png](https://images.gitee.com/uploads/images/2022/0526/163149_32c2b924_1737075.png)

## 3. 接口设计

### 3.1 外部接口

iDB的数据构建流程相对简洁，可以参考如下子模块构建过程，不再展开叙述。

#### 3.1.1 读取LEF文件接口

请参考如下构建流程

```
std::vector<std::string> lef_files = {
    "/home/lef/scc011u_8lm_1tm_thin_ALPA.lef", "/home/lef/scc011ums_hd_hvt_ant.lef",
    "/home/lef/scc011ums_hd_lvt_ant.lef",      "/home/lef/scc011ums_hd_rvt_ant.lef",
    "/home/lef/S013PLLFN_8m_V1_2_1.lef",       "/home/lef/SP013D3WP_V1p7_8MT.lef",
    "/home/lef/S011HD1P1024X64M4B0.lef",       "/home/lef/S011HD1P128X21M2B0.lef",
    "/home/lef/S011HD1P256X8M4B0.lef",         "/home/lef/S011HD1P512X19M4B0.lef",
    "/home/lef/S011HD1P512X58M2B0.lef",        "/home/lef/S011HD1P512X73M2B0.lef",
    "/home/lef/S011HDSP4096X64M8B0.lef"
  };

IdbBuilder* db_builder = new IdbBuilder();

IdbLefService* lef_service = db_builder->buildLef(lef_files);
```

构建的lef_service中包含了Tech数据 IdbLayout，LEF文件路径等供开发者调用。

#### 3.1.2 读取Verilog文件接口

请参考如下构建流程

```
std::vector<std::string> lef_files = {
    "/home/lef/scc011u_8lm_1tm_thin_ALPA.lef", "/home/lef/scc011ums_hd_hvt_ant.lef",
    "/home/lef/scc011ums_hd_lvt_ant.lef",      "/home/lef/scc011ums_hd_rvt_ant.lef",
    "/home/lef/S013PLLFN_8m_V1_2_1.lef",       "/home/lef/SP013D3WP_V1p7_8MT.lef",
    "/home/lef/S011HD1P1024X64M4B0.lef",       "/home/lef/S011HD1P128X21M2B0.lef",
    "/home/lef/S011HD1P256X8M4B0.lef",         "/home/lef/S011HD1P512X19M4B0.lef",
    "/home/lef/S011HD1P512X58M2B0.lef",        "/home/lef/S011HD1P512X73M2B0.lef",
    "/home/lef/S011HDSP4096X64M8B0.lef"
  };


IdbBuilder* db_builder = new IdbBuilder();
IdbLefService* lef_service = db_builder->buildLef(lef_files);

string VerilogPath         = "/home/data/verilog/asic_top_0214.v";
IdbDefService* def_service = db_builder->buildVerilog(VerilogPath);
```

构建的def_service中包含了Tech数据IdbLayout、设计数据IdbDesign、相关路径等，供开发者调用。

#### 3.1.3 读取DEF文件接口

```
std::vector<std::string> lef_files = {
    "/home/lef/scc011u_8lm_1tm_thin_ALPA.lef", "/home/lef/scc011ums_hd_hvt_ant.lef",
    "/home/lef/scc011ums_hd_lvt_ant.lef",      "/home/lef/scc011ums_hd_rvt_ant.lef",
    "/home/lef/S013PLLFN_8m_V1_2_1.lef",       "/home/lef/SP013D3WP_V1p7_8MT.lef",
    "/home/lef/S011HD1P1024X64M4B0.lef",       "/home/lef/S011HD1P128X21M2B0.lef",
    "/home/lef/S011HD1P256X8M4B0.lef",         "/home/lef/S011HD1P512X19M4B0.lef",
    "/home/lef/S011HD1P512X58M2B0.lef",        "/home/lef/S011HD1P512X73M2B0.lef",
    "/home/lef/S011HDSP4096X64M8B0.lef"
  };


IdbBuilder* db_builder = new IdbBuilder();
IdbLefService* lef_service = db_builder->buildLef(lef_files);

std::string def_path = "/home/ysyx/eco/tapout/asic_top_0216.def";
IdbDefService* def_service = db_builder->buildVerilog(def_path);
```

构建的def_service中包含了Tech数据IdbLayout、设计数据IdbDesign、相关路径等数据，供开发者调用。

#### 3.1.4 读取idb文件接口

### 3.2 内部接口

> *内部模块之间的接口。*

## 4. 测试报告

### 4.1 测试环境

> *描述测试环境。*

### 4.2 测试结果

> 描述测试人员应该覆盖的功能点

| **测试****编号** | **测试****版本** | **测试功能点** | **测试****描述** |
| ---------------------- | ---------------------- | -------------------- | ---------------------- |
| TR01                   | V1.0                   |                      |                        |
| …                     | …                     | …                   | …                     |

### 4.3 比对

*图、表描述与第三方的性能比对。*

拥塞图对比

## 5. TO BE DONE

### 5.1 疑难问题

> *描述重点难点问题* ；
>
> *说明在开发过程中遇到的问题，以及解决方法。例如：方法的选择、参数的处理、需要说明的其他具体问题。如果有不能正常工作的模块，说明具体情况，猜测可能的原因。*

### 5.2 待研究

> *待研究问题；神经网络评估：使用上述评估值作为特征，用CNN模型，预测真正的拥塞/最终DRVs违例，待研*
