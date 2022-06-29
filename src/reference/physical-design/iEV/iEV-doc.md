## iEDA-EV 软件设计说明书

**编制：** 邱奕杭

**审核：iEDA 课题组**

**时间：** 2022 年 05 月 22 日

---

## 版本修改历史

| 版本号 | 日期       | 作者   | 简要说明           |
| ------ | ---------- | ------ | ------------------ |
| 0.10   | 2022-05-22 | 邱奕杭 | 形成设计说明书初稿 |
|        |            |        |                    |
|        |            |        |                    |
|        |            |        |                    |
|        |            |        |                    |

---

## 1. 简介

在数字集成电路物理设计过程中，常常需要**评估**若干指标的好坏，以指导**设计优化**工作的开展。一方面，每个设计阶段的评估指标大致相同，主要是线长、拥塞和时序等；另一方面，若要求每个点工具都独立开发评估方法，将带来重复劳动，十分低效。基于上述两点，有必要将“评估”从“设计优化”中独立出来，单独形成一个软件，这就是iEV（**iEv**aluator）。

iEV主要用于评估物理设计各个阶段的性能指标，包括线长、拥塞、时序等。本软件既可以自行解析设计文件（lef/def）输出评估结果，也可以被其他点工具调用后输出评估结果。本文档面向希望调用iEV评估当前设计性能指标的开发者。

### 1.1 设计需求和目标

- 线长评估器：需要支持自行解析设计文件输出评估结果，也需要支持被其他点工具调用后输出评估结果

  - WLM：线负载模型，根据net的fanout评估逻辑综合后netlist的总线长，依赖于.lib的WLM信息
  - HPWL：半周长线长，用组成net的pins所围成的外接矩形的半周长来近似该net的走线长度
  - Clique、Star、Bound2Bound：布局二次解析法中常用的线长近似模型
  - 斯坦纳树：对net构建斯坦那点，并以斯坦纳树长度作为该net的走线长度，主要有HVTree/FLUTE
  - 驱动到负载：计算net的driver到指定sink pin的L-shaped长度
  - 布线：评估全局布线和详细布线阶段的总线长
- 时序评估器：支持被其他点工具调用后输出评估结果

  - 布局：评估布局阶段的时序，同时支持获取指定pin的时序信息，依赖于iSTA
  - 布线：评估布线阶段的时序，依赖于iSTA
- 拥塞评估器：需要支持自行解析设计文件输出评估结果，也需要支持被其他点工具调用后输出评估结果

  - 单元密度：将core区域划分为若干bin，计算每个bin内instance的密度
  - 引脚密度：将core区域划分为若干bin，计算每个bin内pin的个数
  - BBox密度：将core区域划分为若干bin，计算每个bin内net的密度
  - GR拥塞：将die区域划分为若干tile，计算每个tile的overflow值，依赖于iRT

### 1.2 专有名词

| **名词** | **解释**                                                                       |
| -------------- | ------------------------------------------------------------------------------------ |
| HPWL           | Half Perimeter Wire Length，用组成net的pins所围成的外接矩形的半周长来近似net长度     |
| WLM            | Wire Load Model，在.lib文件中记录的net的fanout与线长之间的映射关系                   |
| Clique         | 团模型 ，组成net的pins之间两两相连                                                   |
| Star           | 星模型， 在组成net的pins之间计算重心，将该重心作为虚拟pin，所有pins连接于该虚拟pin   |
| B2B            | 边界模型，只计算每个pin到边界pin的距离，用此距离的和来近似net线长                    |
| HTree          | Horizontal Tree，计算pins水平方向重心，以此构建树干，其余pin连接到树干上形成斯坦那点 |
| VTree          | Vertical Tree，计算pins竖直方向重心，以此构建树干，其余pin连接到树干上形成斯坦那点   |
| FLUTE          | 一种基于查找表的构建斯坦纳树方法                                                     |
| BBox           | Bounding Box，组成net的pins所围成的外接矩形                                          |
| RUDY           | Rectangular Uniform Wire Density，评估BBox拥塞的一类方法                             |
|                |                                                                                      |

### 1.3 参考文档

> 格式为    方法关键词：对应方法的文献标题

- 线长评估器
  - B2B：Kraftwerk2—A Fast Force-Directed Quadratic Placement Approach Using an Accurate Net Model
- 时序评估器
  - FLUTE：FLUTE: Fast lookup table based wirelength estimation technique
- 拥塞评估器
  - RUDY：Fast and Accurate Routing Demand Estimation for Efficient Routability-driven Placement
  - PinRUDY：Global Placement with Deep Learning-Enabled Explicit Routability Optimization
  - RUDY-dev：Routability-Driven Analytical Placement by Net Overlapping Removal for Large-Scale Mixed-Size Designs

### 1.4 使用说明

iEV既可以自行解析设计文件（lef/def）输出评估结果，也可以被其他点工具调用后输出评估结果。前者相比后者的唯一区别是，增加了文件解析的过程。因此，整个软件的使用流程为：文件解析（可选）-> 设置参数 -> 评估 -> 输出评估报告。该流程的后三项为各个评估器共有，将在1.4.2-1.4.4节分别介绍对应评估器的使用方法。

#### 1.4.1 文件解析

- 程序运行：编译iEV后将产生可执行文件 `run_eval`，需要输入第二个参数来配置json文件路径。

  ```tcl
  run_eval <json_path>
  ```

  其具体实现过程包含设置json文件、完善config和wrapper模块、在main函数获取解析后的database。

  - json设置：用于配置iEV的文件读取/输出路径、切换评估模式、设置评估参数等

    ```json
    {
        "iEval": {
            "database_source": "iDB",
            "output_dir_path": "/home/qiuyihang/designs/ieval_run_env",
            "separator": ":",
            "DBWrapper": {
                "tech_lef_path": "/home/qiuyihang/designs/smic_lef/scc011u_8lm_1tm_thin_ALPA.lef",
                "lef_paths": [
                    "/home/qiuyihang/designs/smic_lef/S011HD1P1024X64M4B0.lef",
                    "/home/qiuyihang/designs/smic_lef/S011HD1P256X8M4B0.lef",
                    "/home/qiuyihang/designs/smic_lef/S011HD1P512X58M2B0.lef",
                    "/home/qiuyihang/designs/smic_lef/S011HDSP4096X64M8B0.lef",
                    "/home/qiuyihang/designs/smic_lef/scc011ums_hd_lvt_ant.lef",
                    "/home/qiuyihang/designs/smic_lef/SP013D3WP_V1p7_8MT.lef",
                    "/home/qiuyihang/designs/smic_lef/S011HD1P128X21M2B0.lef",
                    "/home/qiuyihang/designs/smic_lef/S011HD1P512X19M4B0.lef",
                    "/home/qiuyihang/designs/smic_lef/S011HD1P512X73M2B0.lef",
                    "/home/qiuyihang/designs/smic_lef/S013PLLFN_8m_V1_2_1.lef",
                    "/home/qiuyihang/designs/smic_lef/scc011ums_hd_hvt_ant.lef",
                    "/home/qiuyihang/designs/smic_lef/scc011ums_hd_rvt_ant.lef"
                ],
                "def_path": "/home/qiuyihang/designs/iEDA_DP_0215_3.def",
                "output_def_name": "eval_alu.def"
            },
            "EvalWrapper": {
                "eval_net_type": "CongestionNet",
                "bin_cnt_x": 256,
                "bin_cnt_y": 256,
                "tile_size_x": 6150,
                "tile_size_y": 6150,
                "sdc_path": "/home/qiuyihang/designs/smic_timing/asic_top.sdc",
                "wirelength_type": "kHPWL",
                "plot_path": "/home/qiuyihang/designs/ieval_run_env/"
            }
        }
    }
    ```
  - Config模块：提取json文件信息

    ```cpp
    std::string eval_net_type   = getDataByJson(json, {"iEval", "EvalWrapper", "eval_net_type"});
      std::string eval_pin_type   = getDataByJson(json, {"iEval", "EvalWrapper", "eval_pin_type"});
      int32_t     bin_cnt_x       = getDataByJson(json, {"iEval", "EvalWrapper", "bin_cnt_x"});
      int32_t     bin_cnt_y       = getDataByJson(json, {"iEval", "EvalWrapper", "bin_cnt_y"});
      int32_t     tile_size_x     = getDataByJson(json, {"iEval", "EvalWrapper", "tile_size_x"});
      int32_t     tile_size_y     = getDataByJson(json, {"iEval", "EvalWrapper", "tile_size_y"});
      std::string sdc_path        = getDataByJson(json, {"iEval", "EvalWrapper", "sdc_path"});
      std::string wirelength_type = getDataByJson(json, {"iEval", "EvalWrapper", "wirelength_type"});
    ```
  - Wrapper模块：根据config模块获取到的json信息，对lef/def文件解析，转化为iEV的数据类型，存到 `IDBWDatabase`类中

    ```Cpp
    IDBWrapper::IDBWrapper(Config* config) : _idbw_database(new IDBWDatabase())
    {
      _dbw_config  = config->get_dbw_config();
      _eval_config = config->get_eval_config();
      initIDB();
      wrapIDBData();
    }
    void IDBWrapper::initIDB()
    {
      auto* idb_bulider = _idbw_database->_idb_builder;
      std::vector<std::string> lef_files = _dbw_config.get_lef_paths();
      idb_bulider->buildLef(lef_files);
      std::string def_file = _dbw_config.get_def_path();
      idb_bulider->buildDef(def_file);
    }
    void IDBWrapper::wrapIDBData()
    {
      IdbDefService* idb_def_service = _idbw_database->_idb_builder->get_def_service();
      IdbLayout*     idb_layout      = idb_def_service->get_layout();
      IdbDesign*     idb_design      = idb_def_service->get_design();
      wrapLayout(idb_layout);
      wrapDesign(idb_design);
    }
    ```
  - main函数：获取解析后的 database，用于后续评估

    ```cpp
    // get config info
      std::string eval_config_file_path = argv[1];
      Config*     config                = Config::getOrCreateConfig(eval_config_file_path);
      // wrap design info from idb
      IDBWrapper*   idb_wrapper   = new IDBWrapper(config);
      IDBWDatabase* eval_database = idb_wrapper->get_eval_database();
      // start evaluating
    ```

#### 1.4.2 线长评估器

- 使用示例：依次为 实例化线长评估器、设置length_net_list、选择评估模式。

  ```cpp
  // run Wirelength Evaluator
    LengthEvaluator eval;
    eval.set_length_net_list(eval_database->get_design()->get_net_list());
    eval.estimateTotalWL(kHPWL);
    eval.estimateTotalWL(kHTree);
    eval.estimateTotalWL(kB2B);
    eval.estimateTotalWL(kFlute);
  ```

  - 设置length_net_list：传入的参数是iEV的数据类型

    - 若iEV直接基于文件评估，则从database中获取数据，传入参数为
      ```cpp
      eval.set_length_net_list(eval_database->get_design()->get_net_list());
      ```
    - 若iEV由其他点工具调用，则需要其他点工具先将自身的net_list数据类型转化为iEV的length_net_list类型。iEV的length_net_list类型在 `<class LengthNet>`定义
  - 选择评估模式：传入的参数是枚举数值；评估器根据枚举类型调用不同的线长评估模型如HPWL，并输出评估结果

    ```cpp
    enum WirelengthType
    {
      kWLM,
      kHPWL,
      kHTree,
      kVTree,
      kClique,
      kStar,
      kB2B,
      kFlute,
      kSlute,
      kPlaneRoute,
      kSpaceRoute,
      kDR
    };
    ......
    eval.estimateTotalWL(kHPWL);
    eval.estimateTotalWL(kHTree);
    eval.estimateTotalWL(kB2B);
    eval.estimateTotalWL(kFlute);
    ```

#### 1.4.3 时序评估器

- 使用示例：依次为 实例化时序评估器、初始化TimingEngine、进行时序评估

  ```cpp
  // run Timing Evaluator
    TimingEvaluator eval;
    eval.initTimingEngine(idb_builder, sta_workspace_path, lib_file_path_list, sdc_file_path);
    eval.updateEstimateDelay(timing_net_list);
  ```

  - 初始化TimingEngine：需要传入四个参数，分别是idb_builder、存放时序文件的目录路径、相对于该目录下的lib文件和sdc文件路径。这四个参数需要其他点工具提供，以完成时序分析引擎的初始化。初始化包括设置线程数、读取时序相关文件、生成时序评估自身的netlist、初始化RC Tree、建图、获取单位值等。

    ```cpp
    void TimingEvaluator::initTimingEngine(PCL::iDB::IdbBuilder* idb_builder, const char* sta_workspace_path, std::vector<const char*> lib_file_path_list, const char* sdc_file_path)
    {
      _timing_engine = pcl::TimingEngine::getOrCreateTimingEngine();
      _timing_engine->set_num_threads(40);
      _timing_engine->set_design_work_space(sta_workspace_path);
      _timing_engine->readLiberty(lib_file_path_list);
      auto db_adapter = std::make_unique<pcl::TimingIDBAdapter>(_timing_engine->get_ista());
      db_adapter->set_idb(idb_builder);
      db_adapter->convertDBToTimingNetlist();
      _timing_engine->set_db_adapter(std::move(db_adapter));
      _timing_engine->readSdc(sdc_file_path);
      _timing_engine->initRcTree();
      _timing_engine->buildGraph();
      _timing_engine->updateTiming();
      _unit = idb_builder->get_def_service()->get_design()->get_units()->get_micron_dbu();
    }
    ```
  - 进行时序评估：传入的参数为iEV的timing_net_list类型，需要其他点工具先将自身的net_list数据类型转化为iEV的timing_net_list类型。iEV的timing_net_list类型在 `<class TimingNet>`定义。完成时序评估后，在sta_workspace_path路径下将输出完整的时序分析完整报告文件。

    ```cpp
    void updateEstimateDelay(std::vector<TimingNet*> timing_net_list);
    ```

#### 1.4.4 拥塞评估器

- 使用示例：依次为 实例化拥塞评估器、设置参数、进行评估、输出评估报告。

  ```cpp
  // run Congestion Evaluator
    CongestionEvaluator eval;
    // pin density
    eval.set_binGrid(eval_database->get_layout()->get_bin_grid());
    eval.set_congestionInstlist(eval_database->get_design()->get_instance_list());
    eval.estimatePinCount();
    eval.reportPinCount();
    eval.plotPinCount("pin_count_map");
    // bbox congestion
    eval.set_congestionNetlist(eval_database->get_design()->get_congestion_netlist());
    eval.estimateBBoxCongestion(kRUDY);
    eval.plotRoutingCapacity("routing_capacity_map");
    eval.plotBBoxCongestion("bbox_congestion_map");
  ```

  - 设置参数：

    - 若iEV直接基于文件评估，则从database中获取数据，传入参数为
      ```cpp
      // pin density
        eval.set_binGrid(eval_database->get_layout()->get_bin_grid());
        eval.set_congestionInstlist(eval_database->get_design()->get_instance_list());
        // bbox congestion
        eval.set_congestionNetlist(eval_database->get_design()->get_congestion_netlist());
      ```
    - 若iEV由其他点工具调用，则需要其他点工具先将自身的数据类型转化为iEV的数据类型。iEV的数据类型在 `iEval/evaluator/congestion/database` 中定义
    - 不同评估模式需要设置不同参数。评估pin density需要设置bin_grid和instance_list信息，而评估BBox congestion则需要设置bin_grid和net_list信息
  - 进行评估：

    - 评估pin density

      ```cpp
      eval.estimatePinCount();
      ```
    - 评估BBox congestion。此处传入的参数是枚举数值。评估器根据枚举类型，调用不同的BBox评估模型，如RUDY

      ```cpp
      enum RUDY_TYPE
      {
        kRUDY,
        kRUDYDev,
        kPinRUDY
      };
      .......
      eval.estimateBBoxCongestion(kRUDY);
      ```
  - 输出评估结果：有两种打印形式

    - 直接在终端打印信息

      ```cpp
      eval.reportPinCount();
      ```
    - 输出csv文件供可视化，其中传入的参数为输出文件名

      ```cpp
      eval.plotPinCount("pin_count_map");
      ```

## 2. 整体设计

### 2.1 总体架构

iEV 总体架构如下图所示，其中：

<img src="https://images.gitee.com/uploads/images/2022/0523/201951_d7aed15c_8002667.png" height=600>

- **iDB Adapter**：iDB 可以解析 LEF 文件的数据存于 idb_layout，解析 DEF 文件数据存于 idb_design。iEV若以直接读取文件评估的方式被使用，则以 iDB Adapter作为数据来源。iDB Adapter将iDB解析后的数据转化为iEV内部的数据结构，存放到Database中。
- **Database**：iEV的内部数据结构，包括两类数据

  - Layout：与设计环境相关的数据类型，该类型在设计过程中保持不变，包括BinGrid、Region等
  - Design：跟设计本身相关的数据类型，该类型在设计过程中可能变化，包括Net、Pin、Instance等。对于Net和pin的数据类型，根据评估器类型不同，其数据结构也存在差异。以net类型举例，分为 `LengthNet`、`TimingNet`和 `CongestionNet`
- **Evaluator**：基于Database进行各类评估功能的实现

  - Wirelength：线长评估，包含多种可选的评估模式，例如WLM、HPWL等
  - Timing：时序评估，供布局和布线器调用后产生时序报告
  - Congestion：拥塞评估，包括多种可选的评估模式，例如PinDensity、InstDensity等
- **Tool Interface**：iEV为实现评估功能，可能需要依赖的外部工具

  - iRouter：布线器，iEV调用布线器实现GCellGlobalRouting拥塞评估、WireDensity评估等
  - iSTA：静态时序分析工具，iEV调用时序分析引擎获取时序信息、打印时序报告
  - FLUTE/SLUTE：基于查找表的构建斯坦纳树方法，iEV调用该工具构建斯坦纳树以评估线长
  - iDRC：设计规则检查工具，iEV调用该工具实现RegionDRC评估
- **Utility**：支持读取json文件配置评估器参数、可视化绘图、GoogleLog打印结果

### 2.2 软件流程

<img src="https://images.gitee.com/uploads/images/2022/0524/100556_e8979ad3_8002667.png" height=700/>

### 2.3 子模块设计

#### 2.3.1 文件解析器

- 按照实现流程，分为以下两个子模块：

  * Config模块：读取Json配置文件，主要是文件参数和评估参数，供Wrapper模块完成初始化
  * Wrapper模块：利用从json文件解析到的配置信息，初始化iDB，并将iDB数据转化为IEV Database对应的数据类

    子模块流程图如下

    <img src="https://images.gitee.com/uploads/images/2022/0525/113304_828dee1a_8002667.png" height=300/>
- Config模块

  - 整体而言，该模块位于 `iEval/util/config`。根据json信息类别的不同，可新增若干个config类存储不同类别的解析信息，相关实现位于 `iEval/wrapper/config`。Json配置文件也位于 `iEval/wrapper/config`。
  - 具体实现，包括

    - 创建 `<class Config>`单例，该类中包含私有成员 `_dbw_config` 、`_eval_config`。Json文件配置目前主要分为两类信息，一类针对数据转化，定义文件路径等参数，其在json文件中的字段标识为 `"DBWrapper"`；另一类针对评估参数设置，其在json文件中的字段标识为 `"EvalWrapper"`。用 `_dbw_config` 、`_eval_config`分别存储 `"DBWrapper"`和 `"EvalWrapper"`的解析信息。
    - 根据json文件的配置信息，对 `_dbw_config` 和 `_eval_config`分别构建 `<class DBWConfig>`和 `<class EvaluatorConfig>`。
- Wrapper模块

  - 整体而言，转化后的数据类定义在 `iEval/wrapper/database`中，整个数据转化过程在类 `IDBWrapper`中定义实现。
  - 具体实现，包括

    - 转化后的数据包含三个类，分别是 `IDBWDatabase`、`Layout`、`Design`。其中 `IDBWDatabase` 是顶层数据类，该类中包含私有成员 `_layout`、`_design`和 `_idb_builder`。类 `Layout`定义在设计过程中保持不变的数据，例如 `BinGird`、`Region`；类 `Design`定义在设计过程中可能改变的数据，例如 `Net`、`Pin`、`Instance`；`_idb_builder` 用于初始化iDB。
    - 类 `IDBWrapper`继承父类 `DBWrapper`，便于扩展设计其他类型数据库的wrapper。类 `IDBWrapper`包含私有成员 `_dbw_config`、`_eval_config`、`_idbw_database`。其中可以从 `_dbw_config`和 `_eval_config`获得从json文件解析后的配置信息，包括文件参数和评估参数； `_idbw_database`是顶层数据类 `IDBWDatabase` 的实例化，以此完成对iDB初始化、数据转化。转化后的数据存储在 `_idbw_database` 中。
    - iDB初始化：传入从json文件读取而来的lef/def文件路径，以此完成iDB初始化

      ```cpp
      void IDBWrapper::initIDB()
      {
        auto* idb_bulider = _idbw_database->_idb_builder;
        std::vector<std::string> lef_files = _dbw_config.get_lef_paths();
        idb_bulider->buildLef(lef_files);
        std::string def_file = _dbw_config.get_def_path();
        idb_bulider->buildDef(def_file);
      }
      ```
    - 数据转化：分别对Layout和Design进行数据转化

      ```cpp
      void IDBWrapper::wrapIDBData()
      {
        IdbDefService* idb_def_service = _idbw_database->_idb_builder->get_def_service();
        IdbLayout*     idb_layout      = idb_def_service->get_layout();
        IdbDesign*     idb_design      = idb_def_service->get_design();
        wrapLayout(idb_layout);
        wrapDesign(idb_design);
      }
      ```

#### 2.3.2 线长评估器

- 整体而言，模块包含：

  - 线长评估的数据类。定义基础数据类型、线长模型的简单工厂。相关实现位于 `iEval/evaluator/wirelength/database`
  - 线长评估的顶层类。定义评估模式，例如总线长或单线网评估。相关实现位于 `iEval/evaluator/wirelength`
- 线长评估的数据类

  - 基础数据类型：线长评估需要 `Net`和 `Pin`的信息，分别定义在 `<class LengthNet>` 和 `<class LengthPin>`
  - 线长模型的简单工厂：有多种线长模型需要评估，设计一个简单工厂类进行管理，如下图

  <img src="https://images.gitee.com/uploads/images/2022/0525/172730_00f57823_8002667.png" height=400/>
- 线长评估的顶层类：

  - 类私有成员：定义线网列表，为 ` std::vector<LengthNet*> _length_net_list;`
  - 评估网表总线长：其中 `WirelengthType`为枚举类，用于定义线长评估模式，例如 `kHPWL`、`kHTree`、`KFlute`等。确定线长模型后，先分别计算每个单线网的线长，随后累加，即得到网表总线长
    ```cpp
     void estimateTotalWL(WirelengthType wl_type);
    ```
  - 评估单线网长度：其中 `WirelengthType`为枚举类，用于定义线长评估模式，例如 `kHPWL`、`kHTree`、`KFlute`等。另外，可以计算net中指定路径的长度，其中 `estimateDriver2LoadWL`即计算net中驱动到负载的线长，函数传入的参数为net名称和负载pin名称
    ```cpp
      void estimateNetWL(std::string net_name, WirelengthType wl_type);
      void estimateDriver2LoadWL(std::string net_name, std::string sink_pin_name);
    ```

#### 2.3.3 时序评估器

- 整体而言，模块包含：

  - 时序评估的数据类。定义基础数据类型。相关实现位于 `iEval/evaluator/timing/database`
  - 时序评估的顶层类。启动时序分析引擎、定义评估模式。相关实现位于 `iEval/evaluator/timing`
- 时序评估的数据类

  - 基础数据类型：时序评估需要 `Net`和 `Pin`的信息，分别定义在 `<class TimingNet>` 和 `<class TimingPin>`。`<class TimingNet>`中包含私有成员 `std::vector<std::pair<TimingPin*, TimingPin*>> _pin_pair_list`，调用时序评估的其余点工具需要将其自身的数据转化为 `_pin_pair_list`。`<class TimingPin>`中包含私有成员 `bool _is_real_pin；`来区分pin点是斯坦纳点（false）还是真实物理点（true），从而让顶层的评估器调用时序引擎不同接口
- 时序评估的顶层类

  - 类私有成员：定义线网列表和时序分析引擎，分别为 `std::vector<TimingNet*> _timing_net_list` 和 `pcl::TimingEngine* _timing_engine = nullptr;`
  - 时序引擎初始化：需要输入四项参数，分别为idb_builder和其余三项文件路径

    ```cpp
      void initTimingEngine(PCL::iDB::IdbBuilder* idb_builder, const char* sta_workspace_path, std::vector<const char*> lib_file_path_list, const char* sdc_file_path);
    ```
  - 评估延时：初始化时序分析引擎后，开始评估时延，输入参数为线网列表，输出评估后的时序报告

    ```cpp
      void updateEstimateDelay(std::vector<TimingNet*> timing_net_list);
    ```
  - 获取指定pin时序信息：输入参数为pin的名称，输出值用于指导timing-driven placement优化

    ```cpp
      // get pin timing info, called by iPL
      double get_early_slack(std::string pin_name) const;
      double get_late_slack(std::string pin_name) const;
      double get_arrival_early_time(std::string pin_name) const;
      double get_arrival_late_time(std::string pin_name) const;
      double get_required_early_time(std::string pin_name) const;
      double get_required_late_time(std::string pin_name) const;
    ```

#### 2.3.4 拥塞评估器

- 整体而言，模块包含：
  - 拥塞评估的数据类。定义基础数据类型。相关实现位于 `iEval/evaluator/congestion/database`
  - 拥塞评估的顶层类。定义不同的评估模式，还包括输出评估报告、打印热力图等函数。相关实现位于 `iEval/evaluator/congestion`
- 拥塞评估的数据类
  - 基础数据类型：线长/时序评估一般只依赖design层面的数据类型，而拥塞评估还要依赖于layout层面的数据。
    - Design数据：拥塞评估需要 `Net`、`Pin`、`Instance`的信息，分别定义在 `<class CongestionNet>` 、 `<class CongestionPin>`和 `<class CongestionInst>`
    - Layout数据：
      - 对于单元密度、引脚密度、BBox拥塞评估，需要 `BinGrid`的信息，定义在 `<class BinGrid>`。对于 `BinGrid`，需要获取布线资源、线宽信息供评估计算，分别定义为 `int computeRoutingCapacity(int bin_size, PCL::iDB::IdbLayerRouting* idb_layer_routing)`和 `int obtainWirePitch(PCL::iDB::IdbLayerRouting* idb_layer_routing)`。Json文件可以配置评估参数，其中字段 `“bin_cnt_x”`和 `“bin_cnt_y”`确定对core区域按照水平/竖直方向划分的网格数，每个网格属性由 `<class Bin>`定义。`<class Bin>`定义私有成员 `int _pin_num`、`float _inst_density`、`double _bbox_congestion`、`int _horizontal_capacity`、`int _vertical_capacity`、`int _average_wire_width`、`std::vector<CongestionInst*> _inst_list`、`std::vector<CongestionNet*>  _net_list`，从而建立起每个 `bin`与 `bin`内的引脚个数、单元密度、拥塞度、布线资源、线宽、单元列表、线网列表的映射。
      - 对于GR拥塞评估，需要 `TileGrid`的信息，定义在 `<class TileGrid>`。与BinGrid按照core区域划分不同的是，Json文件中的字段 `“tile_cnt_x”`和 `“tile_cnt_y”`确定的是对die区域按照水平/竖直方向划分的网格数，每个网格属性由 `<class Tile>`定义。
- 拥塞评估的顶层类
  - 类私有成员：定义私有成员变量，包括单元列表、线网列表和网格；定义私有成员函数，作为支持评估的辅助功能函数

    ```cpp
      TileGrid* _tileGrid = nullptr;
      BinGrid*  _binGrid  = nullptr;
      std::vector<CongestionInst*> _congestionInstList;
      std::vector<CongestionNet*>  _congestionNetList;

      int32_t getOverlapArea(int lx, int ly, int ux, int uy, CongestionInst* inst);
      int32_t getOverlapArea(int lx, int ly, int ux, int uy, CongestionNet* net);
      double  getRudyRatio(Bin* bin, CongestionNet* net);
      double  getKsRatio(Bin* bin, CongestionNet* net);
      double  getPinRudyRatio(Bin* bin, CongestionNet* net);
    ```
  - 评估模式：包括引脚密度、单元密度、BBox拥塞、GR拥塞。其中输入参数 `RUDY_TYPE`和 `METRIC_TYPE`均为枚举类，可在同种评估模式选择不同的实现方法

    ```cpp
      void estimatePinCount();
      void estimateInstDensity();
      void estimateBBoxCongestion(RUDY_TYPE rudy_type);
      void estimateGRCongestion(METRIC_TYPE metricType);
    ```
  - 输出评估报告：

    ```cpp
      void reportPinCount();
      void reportInstDensity();
      void reportTileGrid();
      void reportBinGrid();
    ```
  - 拥塞热力图：输入文件名，生成csv数据文件，供进一步可视化

    ```cpp
      void plotPinCount(std::string filename);
      void plotInstDensity(std::string filename);
      void plotBBoxCongestion(std::string filename);

    ```

### 2.4 评价指标

评价一种评估器的好坏，主要看如下三项指标：

- **评估精度**：评估得准不准，这是评估器最重要的指标。若评估不准，则可能误导设计优化
- **评估效率**：评估得快不快，指评估程序运行的快慢，可以对评估器进行时间复杂度分析
- **占用内存**：评估程序运行时占用的内存大小

### 2.5 算法设计

#### 2.5.1 线长模型及算法

- 线长模型概览：

<img src="https://images.gitee.com/uploads/images/2022/0525/224048_17edb8ee_8002667.png" height=500/>

- WLM：

  线负载模型WLM是厂商根据多种已经生产出来芯片的统计结果，在同样的工艺下，计算出在某个设计规模范围内（例如门数为0-43478，门数为43478-86956，等等）负载扇出为1的连线的平均长度，负载扇出为2的连线的平均长度，负载扇出为3的连线的平均长度等等。如果遇到连线的扇出大于模型种列出的最大扇出值，将使用外推斜率来估算连线的长度。这些信息都会在.lib文件定义。WLM线长评估模型，则需要读取.lib文件获取到WLM表格，进而估算逻辑综合后的网表总线长。

  ![image.png](https://images.gitee.com/uploads/images/2022/0525/232953_a77b3abc_8002667.png) ![image.png](https://images.gitee.com/uploads/images/2022/0525/233020_83139a0f_8002667.png)
- HPWL：组成net的所有pins围成的外接矩形的半周长。单线网线长的计算式为：$\max _{(x, y) \in V} x-\min _{(x, y) \in V} x+\max _{(x, y) \in V} y-\min _{(x, y) \in V} y .$
- HTree：取组成net的所有pins，计算x方向的平均值作为树干，其余pin水平连接到该树干，从而构成斯坦纳树算线长。单线网线长的计算式为：$\max _{i, j \in e}\left|y_{i}-y_{j}\right|+\sum_{i \in e} \mid x_{i}-$ gravity $\mid$
- VTree：取组成net的所有pins，计算y方向的平均值作为树干，其余pin竖直连接到该树干，从而构成斯坦纳树算线长。单线网线长的计算式为：$\max _{i, j \in e}\left|x_{i}-x_{j}\right|+\sum_{i \in e} \mid y_{i}-$ gravity $\mid$
- Flute/Slute：Flute/Slute通过离线建表，在线查表的方式，可以快速得到一个net的若干个斯坦纳树。下图为算法流程示例：

  ![image.png](https://images.gitee.com/uploads/images/2022/0525/233202_ddab9669_8002667.png)
- Clique：将组成net的所有pins两两相连，计算两两pins的距离和并乘以一个系数，得到总线长。其中系数一般取值为$\frac{1}{|V|-1}$ 或$\frac{2}{|V|}$，${|V|}$指pins的个数。单线网线长的计算式为：$\frac{1}{|V|-1} \sum_{(x, y),\left(x^{\prime}, y^{\prime}\right) \in V}\left(\left|x-x^{\prime}\right|+\left|y-y^{\prime}\right|\right)$
- Star：取组成net的所有pins的x和y方向坐标均值，建立一个虚拟pin点，随后其他pins都连接到该虚拟pin点。单线网线长的计算公式为：$\min _{\left(x^{\prime}, y^{\prime}\right) \in \mathbb{R}^{2}} \sum_{(x, y) \in V}\left(\left|x-x^{\prime}\right|+\left|y-y^{\prime}\right|\right) .$
- B2B：该模型是在Clique模型基础上改进的，Clique模型需要计算内部pin的线长，而B2B则只计算pin到边界pins的线长。以x方向线长计算为例，两种模型对比如下图

  ![image.png](https://images.gitee.com/uploads/images/2022/0526/141312_423d4481_8002667.png)
- Driver2Sink：首先确定线网的driver pin，随后按照L-shaped连线计算driver pin到其余sink pins的线长

#### 2.5.2 时序模型及算法

- 在时序评估中，需要计算路径延时（path delay）。路径延时来源于单元延时（cell delay）和互连线延时（net delay）。单元延时可以从标准单元库.lib文件得知，而互连线延时则需要被计算。三者满足以下关系：

  ```markdown
  Path Delay = Cell Delay + Net Delay
  ```
- 互连线延时计算：

  - 寄生RC参数提取：为了计算Net Delay，首先需要提取出寄生参数电容C和电阻R。如果已有预估的布线（placement/global route）或者真实的绕线（detailed route），那么只需要根据不同层的布线分布就可以提取出相对准确的寄生参数值。
  - Elmore Delay模型：

    - 得到寄生参数RC值后，对于单输入单输出的 net，假设不考虑 net 之间的耦合电容（即不考虑噪声的影响），并且也不存在电阻性的反馈回路的情况，用 Elmore Delay 模型来计算Net Delay。
    - 以下图为例概述该模型和计算方法。在长的导线里，增加的电阻对于驱动门（driver）表现为一个分布的RC负载（load）。为简单起见，驱动门用一个理想的电压源代表，分布的RC线路转变为一个集总的n段RC阶梯结构。总电阻是线路上所有独立电阻的总和，即$R_{\text {wire }}=n R_{w}$；对总电容这种关系同样成立，即$C_{\text {wire }}=n C_{w}$。

    ![image.png](https://images.gitee.com/uploads/images/2022/0526/161326_f82f20fb_8002667.png)

    - 以下图为例具体介绍该模型和计算方法。RC阶梯的elmore delay计算要涉及到要对电路中每个节点计算该节点的电容与从起始节点到该节点所有电阻之和的乘积。其输出点elmore delay表达为：$\tau=R_{1} C_{1}+\left(R_{1}+R_{2}\right) C_{2}+\left(R_{1}+R_{2}+R_{3}\right) C_{3}$。对于一个通常的网络，其elmore delay计算公式为：$\tau_{t}=\sum_{k}\left(C_{k} \times R_{t k}\right)$，其中, 我们感兴趣的节点是 $t , C_{k}$ 是节点 $k$ 的电容, $R_{t k}$ 是从起始节点到节点 $t$ 和从起始节点到节点 $k$ 所有共用的电阻之和。换句话讲，我们访问每个节点并且将该节点的电容与一个电阻值相乘，这个电阻是以下两条路径的共用电阻之和：一条从起始点到节点 $t$, 另一条从起始点到节点 $k$。想要了解更详细的内容，可以查阅书籍《数字集成电路分析与设计：深亚微米工艺第三版》第10章。

      ![image.png](https://images.gitee.com/uploads/images/2022/0526/162144_dd4cd782_8002667.png)
  - 长导线的RC延迟：对于长导线，可根据总的电阻和总的电容计算 $RC$ 延时。如果导线的总长是$L$，并且每一段的长度是 $\Delta L$，那么 $L=n \Delta L$ 。设导线的单位长度电阻是 $R_{\mathrm{int}}=r$，导线单位长度电容是 $C_{\text {int }}=c$ ，总电阻是 $R_{\text {wire }}=r L$ 并且总的电容是 $C_{\text {wire }}=c L$ 假设有 $n$ 段，用elmore delay计算得到：

    $\begin{aligned} \tau_{\text {Elmore }} &=(r \Delta L)(c \Delta L)+2(r \Delta L)(c \Delta L)+\cdots+n(r \Delta L)(c \Delta L) \\ &=(\Delta L)^{2} r c(1+2+\cdots+n) \\ &=(\Delta L)^{2} r c(n)(n+1) / 2 \\ & \approx(\Delta L)^{2} r c n^{2} / 2=L^{2} r c / 2=R_{\text {wire }} C_{\text {wire }} / 2 \end{aligned}$

    为了精确估算延时，还必须包括所有连线上的扇出负载电容。为简化计算，在计算 $R_{\text {wire }}$和$C_{\text {wire }}$后使用集总RC模型代替分布式RC连线。如下图所示，有三种形式的RC集总模型，但并非都适合于延迟计算，可以通过计算相应的时间常数来评估每个模型。

    <img src="https://images.gitee.com/uploads/images/2022/0526/165812_6a14f769_8002667.png" height=200/>

    首先， $L$ 模型的时间常数是 $R_{\text {wire }} C_{\text {wire }}$ 。由于延迟应该是 $R_{\text {wire }} C_{\text {wire }} / 2$，所以不应使用这个模型。第二个模型是 $\Pi$ 模型，电容分为两半赋给输入和输出，时间常数是 $R_{\text {wire }} C_{\text {wire }} / 2$。 第三个模型是 $\mathrm{T}$ 模型, 电阻分为两半赋给输入和输出，这里时间常数也是 $R_{\text {wire }} C_{\text {wire }} / 2$ 。所以，$L$ 模型对于长的分布式 $R C$ 连线不是一个精确的模型，而 $\mathrm{II}$ 模型和 $\mathrm{T}$ 模型产生了正确的结果， 因此对于延迟计算都是命适的。 然而，$T$ 模型有额外的节点, 可能增加计算的数量。其结果是，对于分布式RC连线， $\Pi$ 模型是最常用的集总模型。我们的时序评估也是采用 $\Pi$ 模型。

#### 2.5.3 拥塞模型及算法

- 引脚密度评估：用每个bin中pins的个数来衡量引脚密度

  算法流程为：清空bin内的信息 -> 对bin与instance建立映射 -> 根据每个bin内的instance含有的pin来计算pin的个数

  - 清空bin内的信息

    ```cpp
     // clear bin info
      for (auto bin : _binGrid->get_bin_list()) {
        bin->reset();
      }
    ```
  - 对bin与instance建立映射：遍历整个instance_list；对于每个instace，通过 `get_minMax_x() `和 `get_minMax_y() `确定instance位于二维BinGrid的位置，举个例子，若pair_x=(1，3)则表示该intance在水平方向跨越了第1个到第3个的bin；由于考虑到布局阶段instance可能在core区域外，而BinGrid是对core区域内范围做划分，这就可能导致有些instance索引值小于0或大于最大的bin个数，因此需要在算法中对这些越界情况做限制；最后根据已经确定的instance在BinGird中的索引值，完成每个bin与instance的映射

    ```cpp
     // map bin and inst
      for (auto inst : _congestionInstList) {
        if (inst->isNormalInst()) {
          std::pair<int, int> pair_x = _binGrid->get_minMax_x(inst);
          std::pair<int, int> pair_y = _binGrid->get_minMax_y(inst);
          // fix the out of core bug
          if (pair_x.second >= _binGrid->get_binCntX()) {
            pair_x.second = _binGrid->get_binCntX() - 1;
          }
          if (pair_y.second >= _binGrid->get_binCntY()) {
            pair_y.second = _binGrid->get_binCntY() - 1;
          }
          if (pair_x.first < 0) {
            pair_x.first = 0;
          }
          if (pair_y.first < 0) {
            pair_y.first = 0;
          }
          for (int i = pair_x.first; i <= pair_x.second; i++) {
            for (int j = pair_y.first; j <= pair_y.second; j++) {
              Bin* bin = _binGrid->get_bin_list()[j * _binGrid->get_binCntX() + i];
              bin->add_inst(inst);
            }
          }
        }
      }
    ```
  - 根据每个bin内的instance的pin的位置，累加得到每个bin内pin的个数

    ```cpp
    // estimate pin cout for each bin
      for (auto bin : _binGrid->get_bin_list()) {
        for (auto inst : bin->get_inst_list()) {
          for (auto pin : inst->get_pin_list()) {
            auto pin_x = pin->get_x();
            auto pin_y = pin->get_y();
            if (pin_x > bin->get_lx() && pin_x < bin->get_ux() && pin_y > bin->get_ly() && pin_y < bin->get_uy()) {
              bin->increPinNum();
            }
          }
        }
      }
    ```
  - 辅助功能函数：根据坐标关系确定instance被哪些bin包含，返回索引值。这里以x方向举例

    ```cpp
    std::pair<int, int> BinGrid::get_minMax_x(CongestionInst* inst)
    {
      int lower_idx = (inst->get_inst_lx() - _lx) / _binSizeX;
      int upper_idx = (inst->get_inst_ux() - _lx) / _binSizeX;
      return std::make_pair(lower_idx, upper_idx);
    }
    ```
- 单元密度评估：用每个bin中instance的面积来衡量单元密度

  算法流程为：清空bin内的信息 -> 对bin与instance建立映射 -> 根据每个bin内的instance与当前bin的重叠面积计算单元密度

  - 清空bin内的信息、对bin与instance建立映射，这两个子流程与引脚密度评估实现相同
  - 根据每个bin内的instance与当前bin的重叠面积计算单元密度

    ```cpp
      // estimate inst area for each bin
      for (auto bin : _binGrid->get_bin_list()) {
        int32_t overlap_area = 0;
        float   density      = 0.0f;
        for (auto inst : bin->get_inst_list()) {
          overlap_area += getOverlapArea(bin->get_lx(), bin->get_ly(), bin->get_ux(), bin->get_uy(), inst);
        }
        density = (float) overlap_area / (_binGrid->get_binSizeX() * _binGrid->get_binSizeY());
        bin->set_inst_density(density);
      }
    ```
  - 辅助功能函数：获取重叠面积

    ```cpp
    int32_t CongestionEvaluator::getOverlapArea(int lx, int ly, int ux, int uy, CongestionInst* inst)
    {
      int32_t rect_lx = std::max(lx, inst->get_inst_lx());
      int32_t rect_ly = std::max(ly, inst->get_inst_ly());
      int32_t rect_ux = std::min(ux, inst->get_inst_ux());
      int32_t rect_uy = std::min(uy, inst->get_inst_uy());
      if (rect_lx >= rect_ux || rect_ly >= rect_uy) {
        return 0;
      } else {
        return (rect_ux - rect_lx) * (rect_uy - rect_ly);
      }
    }
    ```
- BBox拥塞评估：用每个bin中net的外接矩形面积来衡量拥塞

  算法流程为：清空bin内的信息 -> 对bin与net建立映射 -> 根据每个bin内的net信息来累加拥塞值

  - 清空bin内的信息、对bin与net建立映射，这两个子流程与引脚密度/单元密度评估实现基本相同，只是将映射对象换为net
  - 根据每个bin内的net信息来累加拥塞值：整体采用RUDY这一类方法来估计BBox拥塞，可细分为三种不同的实现方法。这三类方法分别通过一些辅助功能函数实现，例如 `getRudyRatio()`，将在后续介绍这些辅助功能函数

    ```cpp
     // estimate bbox congestion for each bin
      if (rudy_type == kRUDY) {
        for (auto bin : _binGrid->get_bin_list()) {
          double congestion = 0.0;
          for (auto net : bin->get_net_list()) {
            congestion += getRudyRatio(bin, net);
          }
          bin->set_bbox_congestion(congestion);
        }
      }
      else if (rudy_type == kRUDYDev) {
        for (auto bin : _binGrid->get_bin_list()) {
          int32_t overlap_area = 0;
          double  congestion   = 0.0;
          for (auto net : bin->get_net_list()) {
            overlap_area = getOverlapArea(bin->get_lx(), bin->get_ly(), bin->get_ux(), bin->get_uy(), net);
            congestion += overlap_area * getKsRatio(bin, net);
          }
          bin->set_bbox_congestion(congestion);
        }
      }
      else if (rudy_type == kPinRUDY) {
        for (auto bin : _binGrid->get_bin_list()) {
          double congestion = 0.0;
          for (auto net : bin->get_net_list()) {
            congestion += getPinRudyRatio(bin, net);
          }
          bin->set_bbox_congestion(congestion);
        }
      }
    ```

    - RUDY：

      - RUDY 基于两个假设。一是布线器会尽其所能布线，也即每一个线网的布线长度会近似为于其最小斯坦纳树长度；二是每一个线网相比整个芯片的尺寸来讲都微不足道，因此没有必要对单个线网进行过于准确的布线需求估计。
      - 用$n$表示一个线网的BBox，定义其均匀线密度$d_{n}$，它由线面积和BBox面积的比值决定，表示BBox单位面积的布线需求。其计算方法如下：

        ![image.png](https://images.gitee.com/uploads/images/2022/0526/214632_fbbc4c0c_8002667.png)
      - 其中，分子表示线面积，分母表示BBox的面积，$p$为芯片的平均线间距；$L_{n}$可以由HPWL或最小斯坦纳树线长模型得到，因为HPWL的计算速度明显要快得多，所以采用HPWL估计线长，由上述定义，有$L_{n} = w_{n} + h_{n}$。
      - 为了定义布线需求的数学函数表达, 先在 $X + Y$ 平面上定义矩形区域函数:

        ![image.png](https://images.gitee.com/uploads/images/2022/0526/215617_b6a5843d_8002667.png)

        其中 $x_{l l} 、 y_{l l}$ 表示矩形左下角的点的横纵坐标, $w_{n} 、 h_{n}$ 表示 $\mathrm{BBox}$ 的宽度和高 。随后，将布线需求定义为：$D_{\text {rout }}^{\text {dem }}(x, y)=\sum_{n=1}^{N} d_{n} \cdot R\left(x, y ; x_{n}, y_{n}, w_{n}, h_{n}\right)$，即布局区域内的布线总需求等于该布局上所有线网集合内的每一个BBox占用的线密度加权求和。
      - RUDY由矩形均匀线密度按线网定义，模拟芯片区域上的导线分布，既不依赖于网格，也不依赖于特定的布线器模型，能够准确估计实际的布线需求，并且需要耗费的时间也很少，因此受到广泛的应用。
    - RUDY-Dev：

      - RUDY对于线间距的定义是建立在每个金属层提供的布线资源相同，并且垂直层的布线资源与水平层的布线资源相同的假设下的。
      - 对于这个不足，相关文献提出了改进方法，即将均匀线密度定义为：$d_{n}=\frac{\frac{h_{g}}{c_{h}} \times w_{n}+\frac{w_{g}}{c_{v}} \times h_{n}}{w_{n} \cdot h_{n}}$，其中, $h_{g} 、 w_{g}$ 表示网格的高度和宽度， $c_{h} 、 c_{v}$ 分别表示芯片金属层的垂直和水平布线资源, 故 $\frac{h_{g}}{C_{h}} 、 \frac{w_{g}}{C_{v}}$ 指芯片中水平布线资源和垂直布线资源的线间距, 是对 RUDY中平均线间距的改进。式中分子部分其实就是该线网由HPWL估计的线长并分别乘以水平、垂直布线资源的线间距，也就是改进后的线面积。然而，不足是RUDY-dev将依赖于网格信息。
    - PinRUDY：

      - 属于RUDY方法和引脚密度的结合。该方法在分子项中去掉了RUDY中对线间距的考虑，而将分子项简化为1，若有pin则累加该项一次，其数学表示为：

        <img src="https://images.gitee.com/uploads/images/2022/0526/221424_8359bfab_8002667.png" height=100/>
    - 辅助功能函数：

      - RUDY：辅助函数为 `getRudyRatio()`

        ```cpp
        // this idea is from the paper "Fast and Accurate Routing Demand Estimation for Efficient Routability-driven Placement"
        double CongestionEvaluator::getRudyRatio(Bin* bin, CongestionNet* net)
        {
          double item_1 = 0.0;
          double item_2 = 0.0;
          if (net->get_net_height() != 0) {
            item_1 = bin->get_average_wire_width() / static_cast<double>(net->get_net_height());
          }
          if (net->get_net_width() != 0) {
            item_2 = bin->get_average_wire_width() / static_cast<double>(net->get_net_width());
          }
          return item_1 + item_2;
        }
        ```
      - RUDY-Dev：辅助函数为 `getKsRatio()`

        ```cpp
        // this idea is from the paper "Routability-Driven Analytical Placement by Net Overlapping Removal for
        // Large-Scale Mixed-Size Designs"
        double CongestionEvaluator::getKsRatio(Bin* bin, CongestionNet* net)
        {
          int horizontal_capacity = bin->get_horizontal_capacity();
          int vertical_capacity   = bin->get_vertical_capacity();
          double item_1 = 0.0;
          double item_2 = 0.0;
          if (net->get_net_height() != 0) {
            item_1 = _binGrid->get_binSizeY() / horizontal_capacity / net->get_net_height();
          }
          if (net->get_net_width() != 0) {
            item_2 = _binGrid->get_binSizeX() / vertical_capacity / net->get_net_width();
          }
          return item_1 + item_2;
        }
        ```
      - PinRUDY：辅助函数为 `getPinRudyRatio()`

        ```cpp
        // this idea is from the paper "Global Placement with Deep Learning-Enabled Explicit Routability Optimization"
        double CongestionEvaluator::getPinRudyRatio(Bin* bin, CongestionNet* net)
        {
          double item_1 = 0.0;
          double item_2 = 0.0;
          for (auto pin : net->get_pin_list()) {
            auto pin_x = pin->get_x();
            auto pin_y = pin->get_y();
            if (pin_x > bin->get_lx() && pin_x < bin->get_ux() && pin_y > bin->get_ly() && pin_y < bin->get_uy()) {
              if (net->get_net_height() != 0) {
                item_1 = 1 / static_cast<double>(net->get_net_height());
              }
              if (net->get_net_width() != 0) {
                item_2 = 1 / static_cast<double>(net->get_net_width());
              }
            }
          }
          return item_1 + item_2;
        }
        ```
- GR拥塞评估：调用布线器评估每层TileGrid的拥塞情况

  算法流程为：调用布线器**快速**布线 -> 将【iDB/iRT】数据转化为iEV数据（布线需求、布线资源、网格信息） ->  iEV基于自身数据类型评估拥塞

  - 按流程介绍。（该流程尚未验证，待完善）
  - 补充介绍评估指标Total overflow/Max overflow/ACE是什么及其实现

### 2.6 数据结构设计

#### 2.6.1 文件解析器

主要包括顶层类 `IDBWDatabase`、设计类 `Design`、版图类 `Layout`。借助Sourcetrail软件可视化每个类图。

- IDBWDatabase：

  <img src="https://images.gitee.com/uploads/images/2022/0527/094058_bb946f46_8002667.png" height=600/>
- Design：

  <img src="https://images.gitee.com/uploads/images/2022/0527/094148_e707a4b9_8002667.png" height=600/>
- Layout：

  <img src="https://images.gitee.com/uploads/images/2022/0527/094249_73f403ce_8002667.png" height=400/>

#### 2.6.2 线长评估器

主要包括顶层类 `LengthEvaluator`、数据类 `LengthNet`和 `LengthPin`。借助Sourcetrail软件可视化每个类图。

- LengthEvaluator：

  <img src="https://images.gitee.com/uploads/images/2022/0527/094724_8e9cabba_8002667.png" height=500/>
- LengthNet：

  <img src="https://images.gitee.com/uploads/images/2022/0527/094754_8c836d9a_8002667.png" height=450/>
- LengthPin：

  <img src="https://images.gitee.com/uploads/images/2022/0527/094858_fd985bf5_8002667.png" height=500/>

#### 2.6.3 时序评估器

主要包括顶层类 `TimingEvaluator`、数据类 `TimingNet`和 `TimingPin`。借助Sourcetrail软件可视化每个类图。

- TimingEvaluator：

  <img src="https://images.gitee.com/uploads/images/2022/0527/095256_844e8e15_8002667.png" height=650/>
- TimingNet：

  <img src="https://images.gitee.com/uploads/images/2022/0527/095328_cfc04f8a_8002667.png" height=400/>
- TimingPin：

  <img src="https://images.gitee.com/uploads/images/2022/0527/095437_da29eca6_8002667.png" height=400/>

#### 2.6.4 拥塞评估器

主要包括顶层类 `CongestionEvaluator`，设计数据类 `CongestionNet`、 `CongestionPin`和 `CongestionInst`，版图数据类 `BinGrid`、`TileGrid`。借助Sourcetrail软件可视化每个类图。

- 顶层类CongestionEvaluator：

  <img src="https://images.gitee.com/uploads/images/2022/0527/100138_a27b63b3_8002667.png" height=700/>
- 设计数据类：

  - CongestionNet：

    <img src="https://images.gitee.com/uploads/images/2022/0527/111854_3a3602e1_8002667.png" height=400/>
  - CongestionPin：

    <img src="https://images.gitee.com/uploads/images/2022/0527/112046_61a315b9_8002667.png" height=500/>
  - CongestionInst：

    <img src="https://images.gitee.com/uploads/images/2022/0527/112239_869ad131_8002667.png" height=500/>
- 版图数据类：

  - BinGrid：

    <img src="https://images.gitee.com/uploads/images/2022/0527/112328_e55f5344_8002667.png" height=380/>
  - TileGrid：

    <img src="https://images.gitee.com/uploads/images/2022/0527/112414_8edcec00_8002667.png" height=500/>

## 3. 接口设计

### 3.1 外部接口

- 文件解析器

  ```cpp
    // get config info
    Config* config  = Config::getOrCreateConfig(eval_config_file_path);
    // wrap design info from idb
    IDBWrapper*   idb_wrapper   = new IDBWrapper(config);
    IDBWDatabase* eval_database = idb_wrapper->get_eval_database();
  ```
- 线长评估器

  ```cpp
    eval.set_length_net_list(eval_database->get_design()->get_net_list());
    eval.estimateTotalWL(WIRELENGTH_TYPE);
  ```
- 时序评估器

  ```cpp
    eval.set_timing_net_list(timing_net_list);
    eval.initTimingEngine(idb_builder, sta_workspace_path, lib_file_path_list, sdc_file_path);
    eval.updateEstimateDelay(timing_net_list);
    // get pin timing info, called by iPL
    double get_early_slack(std::string pin_name) const;
    double get_late_slack(std::string pin_name) const;
    double get_arrival_early_time(std::string pin_name) const;
    double get_arrival_late_time(std::string pin_name) const;
    double get_required_early_time(std::string pin_name) const;
    double get_required_late_time(std::string pin_name) const;
  ```
- 拥塞评估器

  ```cpp
    eval.set_binGrid(eval_database->get_layout()->get_bin_grid());
    eval.set_congestionInstlist(eval_database->get_design()->get_instance_list());
    eval.set_congestionNetlist(eval_database->get_design()->get_congestion_netlist());
    eval.estimatePinCount();
    eval.estimateInstDensity();
    eval.estimateBBoxCongestion(kRUDY);
    eval.reportPinCount();
    eval.reportInstDensity();
    eval.plotPinCount("pin_count_map");
    eval.plotInstDensity("inst_density_map");
    eval.plotRoutingCapacity("routing_capacity_map");
    eval.plotBBoxCongestion("bbox_congestion_map");
  ```

### 3.2 内部接口

- 文件解析器

  - 类Config

    ```cpp
      DBWConfig       get_dbw_config() { return _dbw_config; }
      EvaluatorConfig get_eval_config() { return _eval_config; }
      nlohmann::json getDataByJson(nlohmann::json value, std::vector<std::string> flag_list);
    ```
  - 类IDBWrapper

    ```cpp
      void initIDB();
      void wrapIDBData();
      void wrapLayout(IdbLayout* idb_layout);
      void wrapDesign(IdbDesign* idb_design);
      // wrap different netlists
      void wrapLengthNetlists(IdbDesign* idb_design);
      void wrapCongestionNetlists(IdbDesign* idb_design);
      // wrap different pins
      LengthPin*     wrapLengthPin(IdbPin* idb_pin);
      CongestionPin* wrapCongestionPin(IdbPin* idb_pin);
      // wrap instances
      void wrapInstances(IdbDesign* idb_design);
    ```
- 线长评估器

  主要包括评估器构建net_list、net构建pin_list、计算单线网线长的接口

  ```cpp
    // class LengthEvalutor
    void       add_length_net(LengthNet* length_net) { _length_net_list.push_back(length_net); }
    void       add_length_net(const std::string& name, const std::vector<std::pair<int32_t, int32_t>>& pin_list);
    LengthNet* add_length_net(const std::string& name);
    // class LengthNet
    void add_pin(int32_t x, int32_t y);
    void add_pin(LengthPin* pin) { _pin_list.push_back(pin); }
    void add_sink_pin(LengthPin* pin) { _sink_pin_list.push_back(pin); }
    void add_sink_pin(int32_t x, int32_t y, std::string name);
    void add_driver_pin(int32_t x, int32_t y, std::string name);
    double wlm();
    DBU    hpwl();
    DBU    lShapedWL(std::string sink_pin_name);
    DBU    htree();
    DBU    vtree();
    DBU    star();
    DBU    clique();
    DBU    b2b();
    DBU    fluteWL();
    DBU    sluteWL();
    DBU    planeRouteWL();
    DBU    spaceRouteWL();
    DBU    drWL();
  ```
- 时序评估器

  主要包括评估器构建net_list、net构建pin_list、与时序分析引擎交互的接口

  ```cpp
    // class TimingEvalutor
    void       add_timing_net(TimingNet* timing_net) { _timing_net_list.push_back(timing_net); }
    TimingNet* add_timing_net(std::string name);
    void       add_timing_net(const std::string& name, const std::vector<std::pair<TimingPin*, TimingPin*>>& pin_pair_list);
    // class TimingNet
    void add_pin_pair(TimingPin* pin_1, TimingPin* pin_2) { _pin_pair_list.push_back(std::make_pair(pin_1, pin_2)); }
    void add_pin_pair(std::string name_1, int32_t x_1, int32_t y_1, int layer_id_1, std::string name_2, int32_t x_2, int32_t y_2, int layer_id_2);
    void add_pin_pair(int32_t x_1, int32_t y_1, int32_t x_2, int32_t y_2, int layer_id_1, int layer_id_2 = -1, std::string name_1 = "fake", std::string name_2 = "fake");
    // TimingEvaluator.cpp
    _timing_engine->makeResistor(ista_net, first_node, second_node, res); 
    _timing_engine->incrCap(first_node, cap / 2);
    _timing_engine->incrCap(second_node, cap / 2);
    _timing_engine->updateTiming();
    _timing_engine->reportTiming();
    ......

  ```
- 拥塞评估器

  主要包括评估器构建net_list/instance_list/binGrid/tileGrid、net/instance构建pin_list、binGrid/tileGrid构建bin_list/tile_list、辅助功能函数

  ```cpp
    // class CongesitonEvaluator
    void set_tileGrid(int lx, int ly, int tileCntX, int tileCntY, int tileSizeX, int tileSizeY, int numRoutingLayers);
    void set_binGrid(int lx, int ly, int binCntX, int binCntY, int binSizeX, int binSizeY);
    void set_congestionNetlist(std::vector<CongestionNet*> congestionNetlist) { _congestionNetList = congestionNetlist; }
    void set_congestionInstlist(std::vector<CongestionInst*> congestionInstlist) { _congestionInstList = congestionInstlist; }
    int32_t getOverlapArea(int lx, int ly, int ux, int uy, CongestionInst* inst);
    int32_t getOverlapArea(int lx, int ly, int ux, int uy, CongestionNet* net);
    double  getRudyRatio(Bin* bin, CongestionNet* net);
    double  getKsRatio(Bin* bin, CongestionNet* net);
    double  getPinRudyRatio(Bin* bin, CongestionNet* net);
    // class CongestionNet/CongestionInst
    void add_pin(CongestionPin* pin) { _pin_list.push_back(pin); }
    void add_pin(int32_t x, int32_t y, std::string name);
    // class BinGrid
    void initBins();
    void initBins(PCL::iDB::IdbLayers* idb_layer);
    std::pair<int, int> get_minMax_x(CongestionInst* inst);
    std::pair<int, int> get_minMax_y(CongestionInst* inst);
    std::pair<int, int> get_minMax_x(CongestionNet* net);
    std::pair<int, int> get_minMax_y(CongestionNet* net);
    int computeRoutingCapacity(int bin_size, PCL::iDB::IdbLayerRouting* idb_layer_routing);
    int obtainWirePitch(PCL::iDB::IdbLayerRouting* idb_layer_routing);
  ```

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

#### 4.3.1 单元密度评估

从左到右依次为 iEV、商业工具Innovus、开源软件OpenRoad所产生的评估热力图，评估结果基本保持一致。

<img src="https://images.gitee.com/uploads/images/2022/0524/001342_23ee070e_8002667.png" height=250/>

#### 4.3.2 引脚密度评估

从左到右依次为 iEV、商业工具Innovus所产生的评估热力图，热点分布基本保持一致。开源软件OpenRoad不支持绘制引脚密度热力图。

<img src="https://images.gitee.com/uploads/images/2022/0524/001431_d372cd2d_8002667.png" height=250/>

## 5. TO BE DONE

### 5.1 疑难问题

### 5.2 待研究

- 神经网络评估：选择若干评估值作为特征，用CNN模型，预测真正的拥塞/最终DRVs违例
  - Source: Global placement with deep learning-enabled explicit routability optimization

<img src="https://images.gitee.com/uploads/images/2022/0524/110137_04263469_8002667.png" height=300/>
