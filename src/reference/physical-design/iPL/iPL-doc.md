**编制：陈仕健，巫文锐**

**审核：** iEDA课题组

**时间：** 2022年05月27日

---

## 版本修改历史

| 版本号 | 日期       | 作者   | 简要说明                                    |
| ------ | ---------- | ------ | ------------------------------------------- |
| 0.10   | 2022-05-24 | 巫文锐 | LG&DP设计说明书初稿                         |
| 0.11   | 2022-05-27 | 陈仕健 | 检查并补充PL&GP设计说明                     |
| 0.12   | 2022-05-29 | 陈仕健 | 更新iPL外部接口，模块说明                   |
| 0.13   | 2022-05-30 | 陈仕健 | 绘图、更新iPL架构设计                       |
| 0.14   | 2022-05-31 | 陈仕健 | 更新Global Placer、算法设计、更新软件流程图 |
|        |            |        |                                             |

---

## 1. 简介

> *简要描述设计的背景、编写目的、目标读者等；*

iPL是针对电子设计自动化（Electronic Design Automation,EDA）物理设计布局阶段所设计的，能够实现自动化摆放宏单元、标准单元位置功能的布局器。iPL软件架构划分为平台相关模块和优化相关模块。平台相关模块（如评估器、检查器等），开发者可进行平台功能完善开发；优化相关模块（如优化器、操作器），研究人员可进行算法优化探索。

### 1.1 设计功能需求

> *描述需求和目标。*

* **完成单元全局扩散**：最小化互连线长，同时满足区域（划分的布局区域）内单元密度约束，忽略单元重叠。
* **完成单元合法化：** 标准单元对齐site/row，对齐电源（VDD/VSS），保证单元之间相互没有覆盖（overlap），此外所有标准单元都必须在版图之内。
* **支持增量式线长优化**：针对已有布局结果进行增量式单元移动缩减互连线长。
* **支持可绕线性优化**：单元移动解决局部区域绕线拥塞问题。
* **支持布局时序优化**：在布局阶段考虑时序，减小时序违例。
* **支持指定区域布局**：用户可规定布局区域范围、属性及对应单元进行布局。
* **支持多线程、GPU加速**：对布局器运行速度进行优化

### 1.2 专有名词

| **名词** | **解释**                                                                     |
| -------------- | ---------------------------------------------------------------------------------- |
| GP             | Global Placement，全局布局                                                         |
| LG             | Legalization，合法化                                                               |
| DP             | Detail Placement，详细布局                                                         |
| Row            | 布局区域内划分的行，单元的高度等于行高，单元需对齐到某行上                         |
| Site           | 布局区域内最小单位，同样标准单元左下角坐标需要对齐Site左下角坐标                   |
| HPWL           | Half Perimeter Wire Length，互连线网引脚端点构成的外接矩形半周长，是布局的经典目标 |
| Bin            | 对布局区域进行划分所得的网格，评估局部区域内单元的密度                             |
| WAWL           | Weight-Average Wire Length，HPWL的平滑化线长模型                                   |
| LSEWL          | Log-Sum-Exp Wire Length，HPWL的平滑化线长模型                                      |
| Nesterov       | 用以迭代布局的一种梯度方法，被证明是应对一阶凸优化的最佳方法                       |
|                |                                                                                    |

### 1.3 参考文档

> 格式为    方法关键词：对应方法的论文标题

- 单元全局扩散方案
  - ePlace- Electrostatics based Placement using Fast Fourier Transform and Nesterov’s Method
  - RePlAce- Advancing Solution Quality and Routability Validation in Global Placement
  - Dreamplace: Deep learning toolkit-enabled gpu acceleration for modern vlsi placement
- 合法化方案
  - Abacus:Fast legalization of standard cell circuits with minimal movement.
- 线长优化方案
  - SwapCell:An efficient and effective detailed placement algorithm.
  - IndependentSetMatch：Ntuplace3: An analytical placer for large-scale mixed-size designs with preplaced blocks and density constraints.
- 布局时序优化方案
  - Timing-Driven Placement Based on Dynamic Net-Weighting for Efficient Slack Histogram Compression
  - Two Approaches for Timing-Driven Placement By Lagrangian Relaxation
  - Timing-Driven Placement Optimization Facilitated by Timing-Compatibility Flip-Flop Clustering
  - DREAMPlace 4.0: Timing-driven Global Placement with Momentum-based Net Weighting
  - Differentiable-Timing-Driven Global Placement
- 

### 1.4 使用说明

- 为了便于后续文件所处路径的说明，默认从iPL顶层路径 ` $iPL_ROOT` 开始进行文档编写。示例的路径如下：
  
  ```c
  $iPL_ROOT = /home/<user_name>/iEDA/src/iPL
  ```
- 启动iPL有两种方式，一种是从iEDA平台iPlatfrom启动，另一种独立编译运行（**本文档默认使用独立编译运行模式**）。控制编译方式需修改CMakeLists.txt文件配置。
  
  ```c
  <file_location> : $iPL_ROOT/CMakeLists.txt
  ```
  
  ```js
  option(BUILD_IPL_LIB "build ipl as library" OFF) // ON 表示将iPL作为iEDA子工具使用的库编译，OFF 代表独立编译
  ```

### 1.5 iPL的配置运行

- iPL的输入输出依赖于json文件控制。使用者首先需按照配置模板进行参数配置。
  
  ```c
  <file_location> : $iPL_ROOT/src/config/pl_default_config.json
  ```
  
  ```js
  {
  "PL": {
          "database_source": "iDB",				// 使用的工艺及设计文件(lef/def)解析器，默认是使用iDB
          "output_dir_path": "<output_dir_path> + '/'",		// 指定输出文件路径
          "separator": ":",					// iPL中使用的分隔符，默认是“:”
          "DBWrapper": {						// 解析器模块及其配置参数
              "tech_lef_path": "<tech_lef_path>",			// 输入的工艺规格lef文件路径
              "lef_paths": [					// 输入的所需使用lef文件路径
                  "<lef_paths_1>",
                  "<lef_paths_2>",
                  "<lef_paths_3>"
              ],
              "def_path": "<def_path>",				// 输入的物理设计def文件路径
              "output_def_name": "<output_def_name>"		// 输出的def文件名称
          },
          "GP": {							// 单元全局扩散模块及其配置参数
              "Wirelength": {
                  "init_wirelength_coef": 0.25,
                  "reference_hpwl": 446000000,
                  "min_wirelength_force_bar": -300
              },
              "Density": {
                  "target_density": 0.4,				// 单元全局扩散单元密度
                  "bin_cnt_x": 512,				// X方向上划分Bin的个数
                  "bin_cnt_y": 512				// Y方向上划分Bin的个数
              },
              "Nesterov": {
                  "max_iter": 2000,				// 最大迭代次数
                  "max_backtrack": 10,
                  "init_density_penalty": 0.00008,
                  "target_overflow": 0.1,				// 单元全局扩散终止条件
                  "initial_prev_coordi_update_coef": 100,
                  "min_precondition": 1.0,
                  "min_phi_coef": 0.95,
                  "max_phi_coef": 1.05
              }
          },
          "LG": {
              "global_padding": 1					// 单元间隔，单位是1个site的宽度
          },
          "DP": {
              "global_padding": 1					// 单元间隔，单位是1个site的宽度
          }
      }
  }
  ```

#### 1.5.1 完整运行iPL

- 程序运行：编译iPL后将产生可执行文件run_pl，需要输入参数来配置json文件路径。
  
  ```tcl
  run_pl <json_path>
  ```
  
  给出执行iPL示例：
  
  ```c
  /home/<user_name>/iEDA/build/src/iPL/run_pl /home/<user_name>/json/pl_config.json
  ```

#### 1.5.2 运行iPL指定步骤

iPL内部包括全局单元扩散（Global Placement，GP）、合法化（Legalization，LG）、详细布局（Detail Placement，DP）步骤，使用者可按如下操作执行具体步骤。

```c
<file_path> : $iPL_ROOT/src/run_pl.cc
```

```c
#include "PL.hh"									// 引入所需的头文件
using namespace ipl;									// 使用ipl的命名空间
int main(int argc, char* argv[])
{
  std::string json_file = "/home/<user_name>/pl_config.json";				// 输入iPL的配置json文件

  Config*     config = Config::getOrCreateConfig(json_file);				// 使用json文件创建Config类
  IDBWrapper  tmp_builder(config);
  IdbBuilder* idb_builder = tmp_builder.get_pl_database()->get_idb_builder();

  // build DBWrapper
  IDBWrapper* idb_wrapper = new IDBWrapper(idb_builder);				// 构建DBWrapper
  PL*         ipl         = new PL(json_file, idb_wrapper);				// 构建ipl
  ipl->runPL();										// 运行pl或其子模块
  // ipl->runGP();
  // ipl->runLG();
  // ipl->runDP();
  // ipl->runChecker();

  delete ipl;
  delete idb_builder;
  return 0;
}
```

对上述代码进行接口级的介绍

##### 1.5.2.1 配置iPL的Config接口：用户通过该接口读入指定的json文件

```c
<file_path> : $iPL_ROOT/src/config/Config.hh
```

```c
static Config* getOrCreateConfig(const std::string& json_file = "") // 仅保留首次读入json文件的配置，后续可直接无参获取Config类
  {
    static Config _config(json_file);
    return &_config;
  }
```

##### 1.5.2.2 构建DBWrapper：用户有两种方式可以构建iPL所需的数据源。

```c
<file_path> : $iPL_ROOT/src/wrapper/IDBWrapper.hh
```

1. 通过iPL支持的数据源如 ` idb_builder` 进行构建

```c
explicit IDBWrapper(PCL::iDB::IdbBuilder* idb_builder);
```

2. 通过json配置文件iPL进行自动构建

```c
explicit IDBWrapper(Config* config);
```

##### 1.5.2.3 构建PL对象，需输入json文件路径和DBWrapper

```c
<file_path> : $iPL_ROOT/src/PL.hh
```

```c
PL(std::string pl_json_path, DBWrapper* db_wrapper);
```

##### 1.5.2.4 运行iPL或运行iPL子模块

```c
<file_path> : $iPL_ROOT/src/PL.hh
```

```c
void runPL();
void runGP();
void runMP();
void runLG();
void runDP();
void runChecker();
```

## 2. 整体设计

### 2.1 总体架构

#### 2.1.1 功能架构设计

列出GP和DP的整体架构设计，目标是在GP和DP阶段完成多功能、强拓展性的布局软件。

![GlobalPlacer](https://images.gitee.com/uploads/images/2022/0525/011944_aa8c3ba1_10972056.png "GP软件结构.png")

![DetailedPlacer](https://images.gitee.com/uploads/images/2022/0525/011911_3d93cefd_10972056.png "DP软件结构.png")

#### 2.1.2 软件架构设计

软件架构设计在项目代码组织上实现功能架构设计。
![iPL软件架构](https://gitee.com/i-eda/dashboard/attach_files/1078892/download "iPL软件架构")

##### 2.1.2.1 iPL项目目录结构

```bash
<file_location> : $iPL_ROOT
```

```bash
├── cmake							// 项目配置相关
│   ├── *
├── CMakeLists.txt						// iPL的配置
├── src
│   ├── checker							// checker模块
│   │   ├── *
│   │   ├── LayoutChecker.hh
│   │   └── TopoChecker.hh
│   ├── config							// config模块
│   │   ├── *
│   │   ├── Config.hh
│   │   └── pl_default_config.json
│   ├── database						// iPL使用的基础数据
│   │   ├── *
│   ├── evaluator						// evaluator模块
│   │   ├── *
│   │   ├── density
│   │   │   ├── *
│   │   ├── timing
│   │   │   ├── *
│   │   └── wirelength
│   │       ├── *
│   ├── operator						// operator模块
│   │   ├── *
│   │   ├── detail_placer
│   │   │   ├── *
│   │   ├── global_placer
│   │   │   ├── *
│   │   ├── legalizer
│   │   │   ├── *
│   │   ├── macro_placer
│   │   │   ├── *
│   │   └── pre_placer
│   │       ├── *
│   ├── PlacerDB.cc
│   ├── PlacerDB.hh						// PlacerDB，iPL内部数据的统一结构
│   ├── PL.cc
│   ├── PL.hh							// 对外提供控制iPL的接口
│   ├── run_pl.cc						// iPL的顶层flow，控制iPL的流程
│   ├── solver							// slover模块
│   │   ├── *
│   │   ├── conjugate
│   │   │   └── *
│   │   ├── legalization-solver
│   │   │   ├── *
│   │   ├── nesterov
│   │   │   ├── *
│   ├── util							// Utility模块
│   │   ├── *
│   │   ├── grid_manager
│   │   │   ├── *
│   │   ├── ipl-log
│   │   │   ├── *
│   │   ├── topology_manager
│   │   │   ├── *
│   │   └── utility.hh
│   └── wrapper							// wrapper模块
│       ├── *
└── test							// test模块，测试iPL内部的模块
    ├── *
```

##### 2.1.2.2 iPL项目模块说明

* Config模块：读入用户配置的json文件，并分别为iPL内部模块构建对应的配置类。
* Wrapper模块：将设计文档（def）和工艺文档（lef、lib）解析的数据抽取并转化为iPL所需的数据。
* Utility模块：iPL用到的工具类。
* PlacerDB模块：iPL管理数据的接口类。
* Operator模块：具体实现布局步骤，全局布局、合法化、详细布局、宏单元布局。
* Solver模块：放置iPL布局过程中使用的算法。
* Evaluator模块：放置iPL内部或调用外部评估器返回的指标，如线长指标、时序指标等。
* Checker模块：检查当前布局结果的合法性情况，拓扑情况等。

### 2.2 软件流程

![iPL软件流程](https://gitee.com/i-eda/dashboard/attach_files/1080095/download "iPL软件流程")

1. 输入iPL的配置文件pl_config.json
2. iPL根据配置文件自动启动Wrapper模块转化生成iPL的基础数据，或由外部提供DBWrapper，初始化PlacerDB
3. 输入配置文件和DBWrapper初始化iPL的顶层对象PL
4. 运行iPL，分为runGP、runLG、runDP、runChecker。过程中调用Evaluator、Solver、Checker进行对应的评估/求解/检查。
5. 最终布局数据写回源数据库或写出DEF文件

### 2.3 子模块设计

> *描述软件的各个组成子模块的设计，独立完成功能，相互依赖关系等。这些模块的情况*

#### 2.3.1 iPL基础数据Database

基础数据描述布局阶段所需用到的设计信息和版图信息，在iPL中分别由 `Layout` 类和 `Design` 类进行管理。

```c
<file path> : 
$iPL_ROOT/src/database/Layout.hh	// Layout相关数据
$iPL_ROOT/src/database/Design.hh	// Design相关数据
```

1. Layout数据
   
   ```c
   int32_t            _database_unit = -1;	// 数据库单位
     Rectangle<int32_t> _die_shape;		// 版图区域
     Rectangle<int32_t> _core_shape;		// 布局区域
   
     std::vector<Row*>  _row_list;			// 布局行的集合
     std::vector<Cell*> _cell_list;		// 工艺库的单元集合
     std::map<std::string, Row*>  _name_to_row_map;
     std::map<std::string, Cell*> _name_to_cell_map;
   ```
2. Design数据
   
   ```c
   std::string            _design_name;			// 设计名称
     std::vector<Instance*> _instance_list;		// 布局单元的集合
     std::vector<Net*>      _net_list;			// 互连线网的集合
     std::vector<Pin*>      _pin_list;			// 引脚的集合
     std::vector<Region*>   _region_list;			// 布局子区域的集合
   
     std::map<std::string, Instance*> _name_to_inst_map;
     std::map<std::string, Net*>      _name_to_net_map;
     std::map<std::string, Pin*>      _name_to_pin_map;
     std::map<std::string, Region*>   _name_to_region_map;
   ```

#### 2.3.2 Config模块

```c
<file path> :  
$iPL_ROOT/src/config/Config.hh
```

Config模块主要用以读入用户配置的json文件并生成各模块使用的配置类。列出其主要包含的数据

```c
std::string _database_source;				// 数据源

DBWConfig _dbw_config;					// Wrapper模块的配置，后续Wrapper模块将会详细介绍
CheckerConfig _checker_config;				// Checker模块的配置，后续Checker模块将会详细介绍
NesterovPlaceConfig _nes_config;			// NesterovPlace模块的配置，后续NesterovPlace模块将会详细介绍
LegalizerConfig _lg_config;				// Legalizer模块的配置，后续Legalizer模块将会详细介绍
DetailPlacerConfig _dp_config;				// DetailPlacer模块的配置，后续DetailPlacer模块将会详细介绍
```

#### 2.3.3 Wrapper模块

Wrapper模块根据文件解析器读入的数据源，将文件数据转化为iPL的基础数据，便于后续布局的操作

```c
$iPL_WRAPPER = $iPL_ROOT/src/wrapper
```

* 配置

```c
<file path> : $iPL_WRAPPER/config/DBWConfig.hh
```

```c
std::vector<std::string> _lef_paths;				// lef文件路径 
  std::string              _def_path;				// def文件路径
  std::string              _separator;				// 命名时使用的分隔符
  std::string              _output_dir_path;			// 输出文件的路径
  std::string              _output_def_name;			// 输出文件的名称
```

* 所需数据

```c
<file path> : $iPL_WRAPPER/database/IDBWDatabase.hh
```

```c
IdbBuilder* _idb_builder;						// iPL的数据源，暂时仅支持iDB读入

  Layout* _layout;							// Layout数据
  Design* _design;							// Design数据

  std::map<IdbInstance*, Instance*> _ipl_inst_map;			// 数据源单元与iPL单元的映射
  std::map<IdbPin*, Pin*>           _ipl_pin_map;			// 数据源引脚与iPL引脚的映射
  std::map<IdbNet*, Net*>           _ipl_net_map;			// 数据源线网与iPL线网的映射

  std::map<Instance*, IdbInstance*> _idb_inst_map;			// iPL单元与数据源单元的映射
  std::map<Pin*, IdbPin*>           _idb_pin_map;			// iPL引脚与数据源引脚的映射
  std::map<Net*, IdbNet*>           _idb_net_map;			// iPL线网与数据源线网的映射

  friend class IDBWrapper;						// 定义友元，方便IDBWrapper对数据的取用
```

* 操作

```c
<file path> : $iPL_WRAPPER/IDBWrapper.hh
```

```c
public:
  void writeDef(std::string file_name) override;			// 根据文件名写出def文件
  void updateFromSourceDataBase() override;			        // 与数据源数据进行同步
  void writeBackSourceDatabase() override;				// 将iPL数据写回数据源
  void initInstancesForFragmentedRow() override;			// 补全版图由于宏单元行分割造成的布局区域缺失

private: 
  void initIDB();							// 初始化IDB
  void wrapIDBData();							// 封装IDB数据
  void wrapLayout(IdbLayout* idb_layout);				// 封装Layout数据
  void wrapRows(IdbLayout* idb_layout);					// 封装Layout中的行
  void wrapCells(IdbLayout* idb_layout);				// 封装Layout中的工艺单元
  void wrapDesign(IdbDesign* idb_design);				// 封装Design数据
  void wrapInstances(IdbDesign* idb_design);				// 封装Design中的布局单元
  void wrapNetlists(IdbDesign* idb_design);				// 封装Design中的互连线网
  Pin* wrapPin(IdbPin* idb_pin);					// 封装Design中的引脚
  void wrapRegions(IdbDesign* idb_design);				// 封装Design中的区域
```

#### 2.3.4 Checker模块

```c
$iPL_CHECKER = $iPL_ROOT/src/checker
```

Checker模块用以检查版图信息（如当前结果是否对齐到Row/Site，寻找有重叠的单元）和检查并提供iPL拓扑关系

##### 2.3.4.1 LayoutChecker

* 所需数据

```c
<file path> : $iPL_CHECKER/LayoutChecker.hh
```

```c
int32_t      _row_height;						// 布局行高
  int32_t      _site_width;						// 布局Site的宽度
  GridManager* _grid_manager;						// 版图管理器

  PlacerDB* _placer_db;

  std::unordered_multimap<Instance*, Grid*> _inst_to_sites;		//单元与所处的Site的映射
  std::unordered_multimap<Grid*, Instance*> _site_to_insts;		// Site与重叠单元的映射
  friend class LayoutChecker;						// 定义友元为LayoutChecker
```

* 操作

```c
void updatePartInstListArea(std::vector<Instance*> modify_insts);					// 更新给定单元在版图上所占的面积
  void updateAllInstListArea();										// 更新所有单元在版图上所占的面积

  bool                   checkAlignRowSite(Rectangle<int32_t> shape);					// 检查指定区域内单元是否对齐
  std::vector<Instance*> obtainIllegalAlignmentInstList();						// 获取未对齐Row/Site的单元集合
  std::vector<Instance*> obtainIllegalPowerInstList();							// 获取方向未对准Power方向的单元集合

  std::vector<std::pair<Instance*, Instance*>> obtainOverlapInstPairList();				// 获取存在重叠的单元对
  std::vector<Rectangle<int32_t>>              obtainAvailableAreaList(Rectangle<int32_t> range);	// 获取用户指定区域内可用的布局区域
```

##### 2.3.4.2 TopoChecker

```c
<file path> : $iPL_CHECKER/TopoChecker.hh
```

* 所需数据

```c
PlacerDB*        _placer_db;  
  TopologyManager* _topo_manager;		// 拓扑管理器
```

* 操作

```c
TopologyManager* get_topo_manager() const { return _topo_manager; }		// 获取布局网表映射的拓扑管理器
  void updateTopoChecker();							// 更新拓扑管理器中的信息
```

#### 2.3.5 Evaluator模块

Evaluator评估iPL的指标（如线长、密度、时序等）或参与优化过程的评估更新（如线长梯度、密度梯度等）。

##### 2.3.5.1 线长评估

```c
<file_path> : 
$iPL_ROOT/src/evaluator/wirelength/Wirelength.hh
$iPL_ROOT/src/evaluator/wirelength/HPWirelength.hh
$iPL_ROOT/src/evaluator/wirelength/SteinerWirelength.hh
```

* 所需数据
  基于TopoManager模块计算所需数据
* 操作
  Wirelength是线长评估的基类，子类HPWrielength和SteinerWirelength需实现指定的功能接口
  
  ```c
  <file_path> : $iPL_ROOT/src/evaluator/wirelength/Wirelength.hh
  ```
  
  ```c
  virtual int64_t obtainTotalWirelength()                                                    = 0;	// 获取当前总线长
    virtual int64_t obtainNetWirelength(std::string net_name)                                  = 0;	// 获取指定net的线长
    virtual int64_t obtainPartOfNetWirelength(std::string net_name, std::string sink_pin_name) = 0;	// 获取指定net的驱动到负载的线长
  ```

##### 2.3.5.2 线长梯度评估

```c
<file_path> : 
$iPL_ROOT/src/evaluator/wirelength/WirelengthGradient.hh
$iPL_ROOT/src/evaluator/wirelength/WAWirelengthGradient.hh
```

* 所需数据
  
  基于TopoManager模块计算所需数据
* 操作
  
  WirelengthGradient是线长梯度评估的基类，子类WAWirelengthGradient需实现指定的功能接口
  
  ```c
  <file_path> : $iPL_ROOT/src/evaluator/wirelength/WirelengthGradient.hh
  ```
  
  ```c
  virtual void         updateWirelengthForce(float coeff_x, float coeff_y, float min_force_bar)      = 0;	// 根据指定参数计算线长梯度
    virtual Point<float> obtainWirelengthGradient(std::string inst_name, float coeff_x, float coeff_y) = 0;	// 指定单元名字，获取其线长梯度
  ```

##### 2.3.5.3 密度评估

```c
<file_path> : $iPL_ROOT/src/evaluator/density/Density.hh
```

* 所需数据
  基于GridManager模块计算所需数据
* 操作
  
  ```c
  int64_t            obtainOverflowArea();			// 获取当前布局结果溢出的数值
    std::vector<Grid*> obtainOverflowIllegalGridList();		// 获取存在溢出的Bin
  ```

##### 2.3.5.4 密度梯度评估

```c
<file_path> : 
 $iPL_ROOT/src/evaluator/density/DensityGradient.hh
 $iPL_ROOT/src/evaluator/density/ElectricFieldGradient.hh
```

* 所需数据
  基于GridManager模块计算所需数据
* 操作
  DensityGradient是线长梯度评估的基类，子类ElectricFieldGradient需实现指定的功能接口
  
  ```c
  virtual void         updateDensityForce()                                         = 0;	// 更新当前布局下的密度信息
    virtual Point<float> obtianDensityGradient(Rectangle<int32_t> shape, float scale) = 0;	// 获取指定单元尺寸的密度梯度
  ```

##### 2.3.5.5 时序评估

```c
<file_path> :$iPL_ROOT/src/evaluator/timing/TimingEvaluation.hh
```

* 所需数据
  基于线长评估模块中的SteinerWirelength和外部评估器iEval
* 操作
  
  ```
  void updateEvalTiming();			// 更新由iEval返回的时序信息
  ```

#### 2.3.6 Solver模块

```bash
<file_path> : $iPL_ROOT/src/solver/nesterov/Nesterov.hh
```

* 所需数据

```cpp
int _current_iter;					// 标记是第几轮迭代

  float _current_parameter;				// 当前迭代轮次参数
  float _next_parameter;				// 下一迭代轮次参数

  float _current_steplength;				// 当前迭代轮次步长
  float _next_steplength;				// 下一迭代轮次步长

  std::vector<Point<int32_t>> _current_coordis;		// 当前迭代轮次坐标
  std::vector<Point<int32_t>> _next_coordis;		// 下一迭代轮次坐标

  // slp is step length prediction.
  std::vector<Point<int32_t>> _current_slp_coordis;	// 当前迭代轮次参考坐标
  std::vector<Point<int32_t>> _next_slp_coordis;	// 下一迭代轮次参考坐标

  std::vector<Point<float>> _current_gradients;		// 当前迭代轮次梯度
  std::vector<Point<float>> _next_gradients;		// 下一迭代轮次梯度
```

* 操作
  ```cpp
  public:
   // getter.
  const std::vector<Point<int32_t>>& get_next_coordis() const { return _next_coordis; }			// 获取计算的新坐标
  const std::vector<Point<int32_t>>& get_next_slp_coordis() const { return _next_slp_coordis; }		// 获取计算的新参考坐标
  float                              get_next_steplength() const { return _next_steplength; }		// 获取计算的新步长
  
  // function.
  void initNesterov(std::vector<Point<int32_t>> previous_coordis, std::vector<Point<float>> previous_grads, std::vector<Point<int32_t>> current_coordis, std::vector<Point<float>> current_grads);					// 初始化
  void calculateNextSteplength(std::vector<Point<float>> next_grads);		// 计算新步长
  
  void runNextIter(int next_iter);						// 执行下一迭代轮次
  void runBackTrackIter();							// 执行回溯迭代轮次
  
  void correctNextCoordi(int index, Point<int32_t> new_coordi);			// 计算下一迭代轮次坐标
  void correctNextSLPCoordi(int index, Point<int32_t> new_slp_coordi);		// 计算下一迭代轮次参考坐标
  
  void resetAll();								// 重置所有数据
  
  private:
  void checkIterOrder(int next_iter);						// 检查下一迭代轮次是否合法
  
  void swapCoordis();								// 交换上一迭代轮次和当前轮次的数据
  void swapSLPCoordis();
  void swapSteplength();
  void swapGradients();
  void swapParameter();
  
  void cleanNextCoordis();							// 清除数据
  void cleanNextSLPCoordis();
  void cleanNextSteplength();
  void cleanNextGradients();
  void cleanNextParameter();
  
  void  calculateNextCoordis();							// 计算下一迭代轮次坐标
  float calculateSteplength(const std::vector<Point<int32_t>>& prev_slp_coordis, const std::vector<Point<float>>& prev_slp_sum_grads, const std::vector<Point<int32_t>>& cur_slp_coordis, const std::vector<Point<float>>& cur_slp_sum_grads);	// 计算下一迭代轮次梯度
  
  void calculateNextParameter();							// 计算下一迭代轮次参数
  ```

#### 2.3.7 Operator模块

##### 2.3.7.1 Macro Placer

// TODO :  说明文件接口层级的功能

##### 2.3.7.2 Global Placer

```c
$iPL_GP_ROOT : $iPL_ROOT/src/operator/global_placer
```

当前实现了解析法布局，使用梯度法Nesterov

* 配置
  
  ```c
  <file_path> : $iPL_GP_ROOT/nesterov_place/config/NesterovPlaceConfig.hh
  ```

```cpp
// about wirelength.
  float _init_wirelength_coef;
  float _reference_hpwl;
  float _min_wirelength_force_bar;

  // about density.
  float   _target_density;
  int32_t _bin_cnt_x;
  int32_t _bin_cnt_y;

  // about nesterov.
  int32_t _max_iter;
  int32_t _max_back_track;
  float   _init_density_penalty;
  float   _target_overflow;
  float   _initial_prev_coordi_update_coef;
  float   _min_precondition;
  float   _min_phi_coef;
  float   _max_phi_coef;
```

* 所需数据
  ```bash
  <file_path> : $iPL_GP_ROOT/nesterov_place/database/NesterovDatabase.hh
  ```

```cpp
PlacerDB* _placer_db;

  std::vector<NesInstance*> _nInstance_list;		// Nesterov法专用的单元类
  std::vector<NesNet*>      _nNet_list;			// Nesterov法专用的线网类
  std::vector<NesPin*>      _nPin_list;			// Nesterov法专用的引脚类

  std::map<Instance*, NesInstance*> _nInstance_map;	// 与iPL数据的映射
  std::map<Net*, NesNet*>           _nNet_map;
  std::map<Pin*, NesPin*>           _nPin_map;

  std::map<NesInstance*, Instance*> _instance_map;
  std::map<NesNet*, Net*>           _net_map;
  std::map<NesPin*, Pin*>           _pin_map;

  // wirelength.
  TopologyManager*    _topology_manager;
  Wirelength*         _wirelength;
  WirelengthGradient* _wirelength_gradient;
  float               _wirelength_coef;
  float               _base_wirelength_coef;
  float               _wirelength_grad_sum;

  // density.
  GridManager*     _grid_manager;
  BinGrid*         _bin_grid;
  Density*         _density;
  DensityGradient* _density_gradient;
  float            _density_penalty;
  float            _density_grad_sum;

  // nesterov solver.
  bool      _is_diverged;
  Nesterov* _nesterov_solver;

  friend class NesterovPlace;
```

* 操作
  
  ```bash
  <file_path> : $iPL_GP_ROOT/nesterov_place/NesterovPlace.hh
  ```
  
  ```cpp
  public:
    void runNesterovPlace();								// 运行Nesterov布局
    void printNesterovDatabase();								// 打印数据
  
  private:
    void initNesConfig(Config* config);							// 初始化配置
    void initNesDatabase(PlacerDB* placer_db);						// 初始化数据
    void wrapNesInstanceList();
    void wrapNesInstance(Instance* inst, NesInstance* nesInst);
    void wrapNesNetList();
    void wrapNesNet(Net* net, NesNet* nesNet);
    void wrapNesPinList();
    void wrapNesPin(Pin* pin, NesPin* nesPin);
    void completeConnection();
  
    void initFillerNesInstance();								// 初始化Filler
    void initNesInstanceDensitySize();							// 放大单元的尺寸以多涉及Bin
  
    void initNesterovPlace(std::vector<NesInstance*>& inst_list);				// 初始化Nesterov的solver
    void NesterovSolve(std::vector<NesInstance*>& inst_list);
  
    std::vector<NesInstance*> obtianPlacableNesInstanceList();				// 获取可以移动的单元集合
  
    void updateDensityCoordiLayoutInside(NesInstance* nInst, Rectangle<int32_t> core_shape);						// 将单元投影回布局区域内
    void updateDensityCenterCoordiLayoutInside(NesInstance* nInst, Point<int32_t>& center_coordi, Rectangle<int32_t> region_shape);
  
    void initGridManager();								// 初始化网格管理器相关，用以密度梯度评估
    void initGridFixedArea();
  
    void initTopologyManager();								// 初始化拓扑管理器相关，用以线长梯度评估
    void updateTopologyManager();
  
    void initBaseWirelengthCoef();							// 线长参数初始化
    void updateWirelengthCoef(float overflow);
  
    void updatePenaltyGradient(std::vector<NesInstance*>& nInst_list, std::vector<Point<float>>& sum_grads, std::vector<Point<float>>& wirelength_grads, std::vector<Point<float>>& density_grads);						// 更新总梯度
  
    Point<float> obtainWirelengthPrecondition(NesInstance* nInst);			// 设置梯度预条件
    Point<float> obtainDensityPrecondition(NesInstance* nInst);
  
    Rectangle<int32_t> obtainFirstGridShape();						// 获取Bin的尺寸
    int64_t            obtainTotalArea(std::vector<NesInstance*>& inst_list);		// 获取给定单元的总面积
    float              obtainPhiCoef(float scaled_diff_hpwl);				// 获取电势参数
  
    void writeBackPlacerDB();								// 写回PlacerDB
  ```

//////////////////////////////////////////// TODO cut line ///////////////////////////////////////////////////////

##### 2.3.7.3 Legalizer

```c
$iPL_LG_ROOT : $iPL_ROOT/src/operator/legalizer
```

当前实现了Abacus算法和branch&bound算法

* 配置
  
  ```c
  <file_path> : $iPL_LG_ROOT/legalizer/config/LegalizerConfig.hh
  ```

* 所需数据
  ```bash
  <file_path> : $iPL_LG_ROOT/legalizer/database/LGDesign.hh
  <file_path> : $iPL_LG_ROOT/legalizer/database/LGLayout.hh
  <file_path> : $iPL_LG_ROOT/legalizer/database/IPLDBWrapper.hh
  ```

```cpp
  //legalizer's design
  std::string _design_name;
  std::vector<LGInstance> _inst_list;
  std::vector<LGNet>      _net_list;
  std::vector<LGRegion>   _region_list;
  std::vector<LGMaster>   _master_list;
  std::vector<LGPin>      _pin_list;
  
  //legalizer's layout
  std::vector<LGRow> _row_list;
  Rectangle<int32_t> _core;
  double             _dbu_micron;
  int32_t            _site_width;
  int32_t            _row_height;
  int32_t _row_count;
  int32_t _row_site_count;

  // 与iPL数据的映射
  std::map<Instance*, LGInstance*> _ipl_map_inst;
  std::map<Cell*, LGMaster*>       _ipl_map_master;
  std::map<Pin*, LGPin*>           _ipl_map_pin;
  std::map<Net*, LGNet*>           _ipl_map_net;

  std::map<LGMaster*, Cell*>       _master_map_ipl;
  std::map<LGInstance*, Instance*> _inst_map_ipl;
  std::map<LGPin*, Pin*>           _pin_map_ipl;
  std::map<LGNet*, Net*>           _net_map_ipl;

  // wirelength.
  TopologyManager*    _topology_manager;
```

* 操作
  
  ```bash
  <file_path> : $iPL_LG_ROOT/legalizer/Abacus.hh
  ```
  
  ```cpp
  void init();
  void clear();
  bool checkPlacement();
  void fixedCellAssign();

  void          rowAssignFixed(int32_t rowId, const LGInstance& inst);    //assign row for instance
  bool          insertRow(bool isTrial, int32_t rowId, const LGInstance& t, Segment*& seg);    //insert two cell trial or not
  void          removeRow(int32_t rowId, const LGInstance& t, Segment* seg);
  double        placeRow(int32_t rowId, bool isTrial, LGInstance t, bool isReverse, Segment* seg);    //place two cell trial or not
  double        placeRowTrial(std::vector<int32_t> row_list, std::vector<int32_t> cell_list, bool isReverse);
  double        getScore();          //total movement of all cells
  inline double getRowSum(int32_t nowRow);    //total width of cells on the row
  double        deleteCellOnRow(const LGInstance& t, int32_t rowId, bool isTrial, bool isReverse, Segment* seg, std::stack<LGInstance>* oldC = nullptr);
  double        insertCellOnRow(LGInstance t, int32_t rowId, bool isTrial, bool isReverse, Segment* seg, std::stack<LGInstance>* oldC = nullptr);

  void   detailMoveToAnother(bool isReverse, double threshold, int32_t adSize);
  double swapTwoCell(int32_t aId, int32_t bId, bool isTrial, bool isReverse);   //swap two cell trial or not
  void   detailSwapAnother(bool isReverse, double threshold, int32_t adSize, int32_t width);
  void   cellsInit();             //cell pretreating
  void   writeBack();             //wrire back to placerDB
  //排一下rowID行
  double placeRowWithInsert(int32_t rowId, bool isTrial, bool isReverse);

  // sorted cells is needed
  std::vector<LGInstance>* abacusLegal(bool isReverse = false);
  void                     post(bool isReverse);

  bool                     findAvailableSeg(int32_t rowID, const LGInstance& inst, Segment*& seg);  //find available segment on the row
  void                     legalize();   // Abacus
  void                     legalize2();  // BBLegal
  std::vector<LGInstance>* BBLegal(bool isReverse);
  std::vector<int32_t>     branchAndBoundPlace(std::vector<int32_t> cell_list, int32_t k_max, bool isReverse);

  // hpwl
  int64_t hpwl() const;
  int64_t hpwl(LGNet* net) const;
  void    getBox(LGNet* net, Rectangle<int32_t>& net_box) const;
  ```

#### 2.3.7.4 Detail Placer

```c
$iPL_LG_ROOT : $iPL_ROOT/src/operator/detail_placer
```

当前实现了Abacus算法和branch&bound算法

* 配置
  
  ```c
  <file_path> : $iPL_LG_ROOT/legalizer/config/DetailPlacerConfig.hh
  ```

* 所需数据
  ```bash
  <file_path> : $iPL_LG_ROOT/detail_placer/database/DPDesign.hh
  <file_path> : $iPL_LG_ROOT/detail_placer/database/DPLayout.hh
  <file_path> : $iPL_LG_ROOT/detail_placer/database/IPLDBWrapper.hh
  ```

```cpp
  //detail_placer's design
  std::string _design_name;
  std::vector<DPInstance> _inst_list;
  std::vector<DPNet>      _net_list;
  std::vector<DPRegion>   _region_list;
  std::vector<DPMaster>   _master_list;
  std::vector<DPPin>      _pin_list;
  
  //detail_placer's layout
  std::vector<DPRow> _row_list;
  Rectangle<int32_t> _core;
  double             _dbu_micron;
  int32_t            _site_width;
  int32_t            _row_height;
  int32_t _row_count;
  int32_t _row_site_count;

  // 与iPL数据的映射
  std::map<Instance*, DPInstance*> _ipl_map_inst;
  std::map<Cell*, DPMaster*>       _ipl_map_master;
  std::map<Pin*, DPPin*>           _ipl_map_pin;
  std::map<Net*, DPNet*>           _ipl_map_net;

  std::map<DPMaster*, Cell*>       _master_map_ipl;
  std::map<DPInstance*, Instance*> _inst_map_ipl;
  std::map<DPPin*, Pin*>           _pin_map_ipl;
  std::map<DPNet*, Net*>           _net_map_ipl;

  // wirelength.
  TopologyManager*    _topology_manager;
```

* 操作
  
  ```bash
  <file_path> : $iPL_LG_ROOT/detail_placer/Abacus.hh
  ```
  
  ```cpp
  // flow
  void place() {}
  void postProcess() {}

  // init function
  void initDb();
  void initInstance();
  void initRegion();
  // grid function
  void               initGrid();
  std::vector<Grid*> obtainOverlapSiteList(DPInstance* inst);
  void               fixedCellAssign();
  void               groupGridAssign();
  void               groupGridInit();
  // dp function
  void detailPlacementWLOpt();  // main
  void stdCellWLOpt();
  void stdCellWithoutGroupsWLOpt();
  void wireLengthOptimization();
  // dp subflow
  void GSwap();
  void VSwap();
  void Reorder();
  void independentSetMatch();
  void mcfSpreadCell();
  void rowOPT();

  // write back
  void writeBackInstance();
  ```

### 2.4 评价指标

评价一种布局器的好坏，主要看如下三项指标：

- **优化目标**：评估布局跑完之后对版图的优化效果，如：线长、时序等。
- **合法性**：评估结果是否满足所设定的各种约束，如：密度、单元重叠等。
- **运行时间**：评估程序开始运行到结束所需时间（CPU）。

### 2.5 算法设计

> *描述软件用到的主要算法，可以用伪代码的形式描述。*

#### 2.5.1 全局布局模型及算法

##### 2.5.1.1 线长模型

* 理论
  ![线长模型](https://gitee.com/i-eda/dashboard/attach_files/1080014/download "线长模型")
  全局布局使用的线长评估模型是半周长线长模型HPWL，它能够准确描述3个pin点以下规模的线网（该类型线网在设计中占大多数），且具有计算简便，准确性高的特点。
  ![HPWL模型](https://gitee.com/i-eda/dashboard/attach_files/1080011/download "HPWL模型")
  由于HPWL模型非光滑，为了后续融合梯度法，需对其进行平滑化处理。有两种常用的线长平滑化函数，分别是LSE和WA。
  ![LSE线长模型](https://gitee.com/i-eda/dashboard/attach_files/1080012/download "LSE线长模型")
  ![LSE线长模型图示](https://gitee.com/i-eda/dashboard/attach_files/1080017/download "LSE线长模型图示")
  ![WA线长模型](https://gitee.com/i-eda/dashboard/attach_files/1080013/download "WA线长模型")
  ![WA线长模型图示](https://gitee.com/i-eda/dashboard/attach_files/1080018/download "WA线长模型图示")
* 代码实现
  
  ```bash
  <file_directory> : $iPL_ROOT/src/evaluator/wirelength
  ```

##### 2.5.1.2 密度模型

* 理论
* 代码实现
  
  ```bash
  <file_directory> : $iPL_ROOT/src/evaluator/density
  ```

##### 2.5.1.3 Nesterov布局模型

* 理论
  ![Nesterov迭代](https://gitee.com/i-eda/dashboard/attach_files/1079982/download "Nesterov迭代")
* 对应的代码实现

```bash
<file_path> : $iPL_ROOT/src/solver/nesterov/Nesterov.cpp
```

```cpp
// 给定梯度向量求步长
void Nesterov::calculateNextSteplength(std::vector<Point<float>> next_grads)
{
  if (!_next_gradients.empty()) {
    // print the error infomations. level 0.
  }
  _next_gradients  = std::move(next_grads);
  _next_steplength = calculateSteplength(_current_slp_coordis, _current_gradients, _next_slp_coordis, _next_gradients);
}
float Nesterov::calculateSteplength(const std::vector<Point<int32_t>>& prev_slp_coordis, const std::vector<Point<float>>& prev_slp_sum_grads, const std::vector<Point<int32_t>>& cur_slp_coordis, const std::vector<Point<float>>& cur_slp_sum_grads)
{
  float coordi_distance = getDistance(prev_slp_coordis, cur_slp_coordis);
  float grad_distance   = getDistance(prev_slp_sum_grads, cur_slp_sum_grads);
  return coordi_distance / grad_distance;
}
static float getDistance(const std::vector<Point<int32_t>>& a, const std::vector<Point<int32_t>>& b)
{
  float sumDistance = 0.0f;
  for (size_t i = 0; i < a.size(); i++) {
    sumDistance += static_cast<float>(a[i].get_x() - b[i].get_x()) * static_cast<float>(a[i].get_x() - b[i].get_x());
    sumDistance += static_cast<float>(a[i].get_y() - b[i].get_y()) * static_cast<float>(a[i].get_y() - b[i].get_y());
  }
  return sqrt(sumDistance / (2.0 * a.size()));
}
```

```cpp
// 计算新的解及新的参考解
void Nesterov::calculateNextCoordis()
{
  if (!_next_coordis.empty() || !_next_slp_coordis.empty()) {
    LOG_ERROR << "Error in calculateNextCoordis : _next_coordis/_next_slp_coordis is not empty!";
  }

  float coeff = (_current_parameter - 1.0) / _next_parameter;

  for (size_t i = 0; i < _current_coordis.size(); i++) {
    Point<int32_t> next_coordi(_current_slp_coordis[i].get_x() + _current_steplength * _current_gradients[i].get_x(), _current_slp_coordis[i].get_y() + _current_steplength * _current_gradients[i].get_y());
    Point<int32_t> next_slp_coordi(next_coordi.get_x() + coeff * (next_coordi.get_x() - _current_coordis[i].get_x()), next_coordi.get_y() + coeff * (next_coordi.get_y() - _current_coordis[i].get_y()));
    _next_coordis.push_back(next_coordi);
    _next_slp_coordis.push_back(next_slp_coordi);
  }
}
```

```cpp
// 参数更新
void Nesterov::calculateNextParameter()
{
  _next_parameter = (1.0 + sqrt(4.0 * _current_parameter * _current_parameter + 1.0)) * 0.5;
}
```

#### 2.5.2 合法化模型及算法

- 合法化基本模型
  ![合法化](https://images.gitee.com/uploads/images/2022/0525/123837_07b3a749_10972056.png "合法化.png")
- Abacus
  对所有单元按照从横坐标顺序进行排列，依据当前总体局面，逐个为每个标准单元选取最合适的行，允许行内的适当调整。
  ![Abacus](https://images.gitee.com/uploads/images/2022/0525/134112_86bbbb71_10972056.png "Abacus.png")
-伪代码
![Abacus伪代码](https://images.gitee.com/uploads/images/2022/0614/163123_2617e7fb_10972056.png "屏幕截图.png")

#### 2.5.3 详细布局模型及算法

- 单元扩散
  建图：对整个版图划分格子，对格子之间进行连边，根据格子中的面积进行供给点和需求点分析，形成最小费用最大流（MCMF）问题。
  ![MCMF](https://images.gitee.com/uploads/images/2022/0525/141119_18a59af9_10972056.png "MCMF.png")
- 全局交换
  对于线长提升的策略来说，将一个单元与其他单元或者空白的位置交换被证明是有效的。但是需要对于选择哪个区域/单元进行交换，并且考虑交换后带来的影响。
  寻找最优区域：
  ![最优区域](https://images.gitee.com/uploads/images/2022/0525/141854_019deddc_10972056.png "最优区域.png")
  惩罚函数示例：
  ![单元交换的惩罚函数](https://images.gitee.com/uploads/images/2022/0525/142103_4b1f6682_10972056.png "penalty function.png")
- 局部重排序
  使用基于窗口的方案，设置一个固定大小的窗口，并且在窗口里尝试将其中的单元进行重排序，选取线长最短的顺序作为结果。
  ![重排序](https://images.gitee.com/uploads/images/2022/0525/143512_6ef2c749_10972056.png "LocalReorder.png")
- 单元翻转
  由于标准单元上的Pin的位置不同，当标准单元在水平方向进行镜像对称时，所得线网也是不同的，因此会对线长造成一定影响。
  ![单元翻转](https://images.gitee.com/uploads/images/2022/0525/144049_fead67c7_10972056.png "单元翻转.png")
-行内优化
![行内移动](https://images.gitee.com/uploads/images/2022/0614/162835_f331e1d9_10972056.png "屏幕截图.png")
### 2.6 数据结构设计

> *描述用到的主要数据结构，包括类的设计，继承关系等等*

合法化：
![Legalizer类](https://images.gitee.com/uploads/images/2022/0525/170748_dca6d015_10972056.png "屏幕截图.png")
详细布局：
![DetailPlacer类](https://images.gitee.com/uploads/images/2022/0525/170911_ad273a39_10972056.png "屏幕截图.png")

## 3. 接口设计

### 3.1 外部接口

> *包括用户界面、软件接口。*

* 当前iPL支持配置json整体运行或运行其子模块（GP、LG、DP、Checker）

```bash
<file_path> : $iPL_ROOT/src/PL.hh
```

```cpp
//接口
  void runPL();
  void runGP();
  void runMP();
  void runLG();
  void runDP();
  void runChecker();
```

* 写入写出数据库
  iPL与数据源（iDB）交互的接口

```bash
<file_path> : $iPL_ROOT/src/PlacerDB.hh
```

```cpp
void updateFromSourceDataBase();       // 同步数据源和iPL数据库接口
void writeBackSourceDataBase();	       // 将iPL数据写回数据源
void writeDef(std::string file_name);  // 写出def文件
```

* 评估器获取评估指标
  iPL与评估器（iEval）交互的接口
  
  ```bash
  <file_path> : $iPL_ROOT/src/evaluator/timing/TimingEvaluation.hh
  ```
  
  ```cpp
  void updateEvalTiming();
  ```

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

#### 4.3.1

#### 4.3.2

## 5. TO BE DONE

### 5.1 疑难问题

> *描述重点难点问题* ；
> 
> *说明在开发过程中遇到的问题，以及解决方法。例如：方法的选择、参数的处理、需要说明的其他具体问题。如果有不能正常工作的模块，说明具体情况，猜测可能的原因。*

### 5.2 待研究

> *待研究问题；*

