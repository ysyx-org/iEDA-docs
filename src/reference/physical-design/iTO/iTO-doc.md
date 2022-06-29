**审核：iEDA 课题组**

**时间：** 2022 年  月  日

---

## **版本修改历史**

| **版本号** | **日期**       | **作者** | **简要说明** |
| ---------------- | -------------------- | -------------- | ------------------ |
| **0.10**   | **202x-xx-xx** |                |                    |
|                  |                      |                |                    |
|                  |                      |                |                    |
|                  |                      |                |                    |
|                  |                      |                |                    |

---

## 1. 简介

> *简要描述设计的背景、编写目的、目标读者等；*

**时序优化(Timing Optimization)是电子设计自动化(EDA)工具中的一个关键流程， 目标是确保芯片设计在功能上是正确的，并且性能指标符合设计要求。 为了保证芯片能够正常工作并达到预期频率，需要对时钟信号和数据信号进行检查，确保信号到达寄存器的时间满足建立时间(Setup time)约束和保持时间(Hold time)约束的要求， 如果不满足约束要求将出现时序违例， 此时需要对相应的时钟线和数据线进行修复优化。 时序优化在芯片设计过程中占据重要地位，是数字芯片设计特别是先进工艺数字设计的重要瓶颈。**

**在先进的大规模工艺数字电路设计中， 可能包含数亿个门级单元和数百个工艺角。这就对时序工具处理大规模数据的能力提出挑战。同时，在优化的过程中，任何单元移动或走线变化都会影响到时序，此时就需要对整个芯片和所有的工艺角进行实时更新，以避免对其他元件或工艺角造成新的时序违例。此外，还要考虑单元的物理位置移动或走线变化是否会导致版图设计规则违例(Design Rule )。**

**iTO 是针对数字后端设计中物理设计中的 Timing Optimization 设计的。主要目标包括：时序设计规则违例优化、保持时间优化、建立时间优化。**

### 1.1 设计需求和目标

> *描述需求和目标。*

* **iTO 需要支持读入 DEF 文件和 SDC 文件进行时序优化：在 EDA 工具链中，DEF 文件在衔接不同工具间流程和数据交换过程中扮演着一个重要角色，同时 SDC 文件对电路的时序，面积，功耗进行约束，它是设计的命脉，决定了芯片是否满足设计要求的规范。iTO 通过 iDB 读入 DEF 文件和相关 LEF 文件获得版图的图形信息和工艺规则信息，并通过 iSTA 读入 SDC 文件和相关 LIB 文件对电路的时序信息进行评估，实现时序违例检查以及时序设计规则违例优化、保持时间优化、建立时间优化。**
* **iTO 需要支持在运行其他工具时进行调用：时序优化是EDA工具中的一个关键流程。在实际的应用中，时序优化可以应用多次，例如，在时钟树综合前后分别进行时序分化，时序优化也可以在布线前后分别进行。因此时序优化需要支持被其他工具调用。**

### 1.2 专有名词

| **名词** | **名词解释**                                                       |
| -------------- | ------------------------------------------------------------------------ |
| 保持时间约束   | 对于存储元件，当时钟沿到达之后，输入信号仍需保持稳定的时间               |
| 建立时间约束   | 对于存储元件，当时钟沿到达时，输入信号必须达到稳定(稳态)所需要的时间     |
| 实际到达时间   | 信号(数据或时钟)到达电路某一指定位置的实际时间                           |
| 期望到达时间   | 信号(数据或时钟)到达电路某一指定位置的期望时间                           |
| 时间裕量       | 信号的到达时间与期望时间之间的差值                                       |
| 负载电容       | 对于一条线网，负载电容为驱动引脚所驱动的线上电容与所有负载引脚电容的总和 |

### 1.3 参考文档

* **LEF/DEF 文档说明**

### 1.4 使用说明

> *每一个模块**/**核心类**/**子程序的功能，需要的参数，截屏*

#### 1.4.1 iTO 工具独立进行时序优化的大体流程

```
int main() {
  string    config_file = "/home/wuhongxi/iEDA_new/iEDA/src/iTO/src/config/Config.json";
  // 通过配置文件初始化iTO类，由iTO控制优化目标。初始化iTO类时也会初始化iDB和iSTA
  ito::iTO *ito = new ito::iTO(config_file);
  ito->runStdTO();

  delete ito;
  return 0;
}
```

其中 iTO 类构造函数如下

```
  iTO(const string &config_file) {
    _config = new Config;
    JsonParser *json = JsonParser::get_json_parser();
    json->parse(config_file, _config);
    // 数据交互，初始化iDB、iSTA
    initialization(config_file);
  }
```

可以看到 iTO 在读 DEF 文件和 SDC 文件运行模式下，需要一个 json 配置文件记录需要读入的DEF、LEF、SDC、LIB 文件路径。iTO 通过解析 json 配置文件中的文件路径并借助 IDB、iSTA 来读取对应文件数据。

iTO 的配置文件格式以及各参数含义如下：

```
{
    # 输入、输出文件的路径
    "file_path": {
        "design_work_space": " ",  // 时序评估工作目录
        "sdc_file": " ",	   // SDC文件路径
  
        "lib_files": [
            " ", " ", ..., " "],   // LIB文件路径

        "lef_files": [
            " ", " ", ..., " "],   // LEF文件路径

        "def_file": " ",	   // DEF文件路径

        "output_def": " ",	  // 输出DEF文件路径

        "report_file": " ",      // 优化结果的报告路径
        "gds_file" : " "         // GDS文件保存路径
    },

    # 建立时间、保持时间裕量，低于该值时视为出现违例
    "setup_slack_margin": 0.0,
    "hold_slack_margin": 0.5,

    # 插入的缓冲器个数与单元个数之比
    "max_buffer_percent": 0.2,

    # 单元面积占比
    "max_utilization": 0.8,

    # 时序优化目标：是否进行时序设计规则违例优化、保持时间优化、建立时间优化
    "optimize_drv": false,
    "optimize_hold": false,
    "optimize_setup": true,

    # 指定时序设计规则违例优化时插入的缓冲器，为空时将由工具自主选定
    "DRV_insert_buffer": " ",

    # 进行建立时间优化时，运行建立时间裕量连续变差的最大次数
    "number_passes_allowed_decreasing_slack": 50,
  
    # 线网的扇出低于该值时才进行建立时间优化，否则需要进行扇出优化
    "rebuffer_max_fanout": 20,
  
    # 允许单元驱动的最大扇出
    "split_load_min_fanout": 8
}
```

#### 1.4.2 iTO 被其他工具调用时的大体运转流程

其他工具通过传递 iDB 和 iSTA 调用 iTO 进行时序优化

```
  // iTO 单独使用不同，被其他工具调用时需要传递iDB和iSTA
  iTO(const string &config_file, IdbBuilder *idb, TimingEngine *timing) {
    _config = new Config;
    JsonParser *json = JsonParser::get_json_parser();
    json->parse(config_file, _config);
    // 数据交互，初始化iDB、iSTA
    initialization(config_file, idb, timing);
  }
```

iTO 在被其他工具调用与单独使用的不同点在于： iTO 类的构造函数参数不同。

## 2. 整体设计

### 2.1 总体架构

![image.png](https://images.gitee.com/uploads/images/2022/0524/000112_5bcb9bd0_5376247.png)

**iTO 的总体架构如上图所示，其中：**

* **iDB（DEF/LEF 数据）**：iDB 可以解析 LEF 文件的数据存于 idb_layout、解析 DEF 文件数据存于 idb_design。iTO 以 iDB 作为数据来源之一。
* **iSTA（SDC/LIB 数据）**：iSTA可以解析 SDC 和 LIB 文件，并提供时序分析。
* **DbInterface（数据转换）**：启动 iDB 和 iSTA，并进行一些数据初始化。同时 DbInterface 类也是iTO 其他子模块的数据来源，其他子模块将不再进行 iDB 和 iSTA 的初始化。iTO 与其他工具的交互也通过该类，即将 iDB 和 iSTA 作为参数进行传递，这样 DbInterface 内部不再对其进行初始化。
* **工具模块**：工具模块包括RC树评估、绕线评估以及单元摆放合法化。
* **优化模块**：优化模块包括时序设计规则违例优化、保持时间优化以及建立时间优化。

### 2.2 软件流程

> **描述软件的总体处理流程，****用文字描述清楚整个运行过程，并附上相应的代码**

![image.png](https://images.gitee.com/uploads/images/2022/0524/112402_aee4421c_5376247.png)

在 2.1 节中我们对 iTO 的整体框架进行了简单的介绍，下面我们通过代码来更深层次的了解 iTO 的流程。

iTO 点工具的流程由 ito 命名空间下的 iTO 类的对象来控制。因此首先需要创建 iTO 类的对象。下面我们以 1.4.1 中单独运行的方式来讲述 iTO 的代码流程。

1. **创建 iTO 流程控制对象**

   ```
   string    config_file = "/home/wuhongxi/iEDA_new/iEDA/src/iTO/src/config/Config.json";
   // 通过配置文件初始化iTO类，由iTO控制优化目标。初始化iTO类时也会初始化iDB和iSTA
   ito::iTO *ito = new ito::iTO(config_file);
   ito->runStdTO();
   ```
2. **数据初始化**

数据初始化步骤在创建 iTO 类的对象时进行，由 DbInterface 类控制。在单独使用时的初始化方式为

```
DbInterface *DbInterface::get_db_interface(Config *config) {
  static std::mutex mt;
  if (_db_interface == nullptr) {
    std::lock_guard<std::mutex> lock(mt);
    if (_db_interface == nullptr) {
      _db_interface = new DbInterface(config);
      _db_interface->initData();
    }
  }
  return _db_interface;
}
```

在被其他工具调用时的初始化方式为

```
DbInterface *DbInterface::get_db_interface(Config *config, IdbBuilder *idb,
                                           TimingEngine *timing) {
  static std::mutex mt;
  if (_db_interface == nullptr) {
    std::lock_guard<std::mutex> lock(mt);
    if (_db_interface == nullptr) {
      _db_interface = new DbInterface(config);
      _db_interface->_timing_engine = timing;
      _db_interface->_idb = idb;
      _db_interface->initData();
    }
  }
  return _db_interface;
}
```

在工具独立进行时序优化时，需要启动 iDB 和 iSTA，启动过程由 `initData()` 控制。

启动 iDB 时工具从 Config 类中获得 DEF、LEF 文件路径，并借助 iDB 工具将数据从文件读取到内存中，该步骤由 DBInit 类控制。

```
oid DBInit::initDB(Config *config) {
  _idb_builder = new IdbBuilder();
  // DEF、LEF 文件路径
  string         def_file = config->get_def_file();
  vector<string> lef_files = config->get_lef_files();

  _idb_builder->buildLef(lef_files);
  _idb_builder->buildDef(def_file);
}
```

启动 iSTA 时工具从 Config 类中获得 LIB、SDC 文件路径，并借助 iSTA 工具将数据从文件读取到内存中，该步骤由 StaInit 类控制

```
void StaInit::initiSTA(Config *config, IdbBuilder *idb) {
  _timing_engine = TimingEngine::getOrCreateTimingEngine();

  const char *         design_work_space = config->get_design_work_space().c_str();
  vector<const char *> lib_files;
  for (auto &lib : config->get_lib_files()) {
    lib_files.push_back(lib.c_str());
  }

  // 读取 LIB 文件
  _timing_engine->readLiberty(lib_files);

  const char *sdc_file = config->get_sdc_files().c_str();
  if (sdc_file != nullptr) {
  // 读取 SDC 文件
    _timing_engine->readSdc(sdc_file);
  }
}
```

DbInterface 作为数据交互接口，是 iTO 其他模块的数据来源。

3. **时序优化目标**

时序优化目标由 iTO 类的 `runStdTO `函数控制。用户可通过配置 json 文件中的 "optimize_drv"、"optimize_hold" 和 "optimize_setup" 进行设置。

其中runStdTO()函数的内容为：

```
void iTO::runStdTO() {
  if (_config->get_optimize_drv()) {
    // 优化时序设计规则违例
    optimizeDesignViolation();
  }
  if (_config->get_optimize_hold()) {
    // 优化保持时间违例
    optimizeHold();
  }
  if (_config->get_optimize_setup()) {
    // 优化建立时间违例
    optimizeSetup();
  }
}
```

4. **时序优化结果报告**

时序优化结果报告由 Reporter 类控制，Reporter 类的对象在 DbInterface 类中构建

```
// log report
string report_path = _config->get_report_file();
_reporter = new Reporter(report_path);
```

Reporter 对象通过报告输出路径进行初始化，分别为三个不同的时序优化目标实现报告格式：

```
// 时序设计规则优化报告
void reportDRVResult(int repair_count, int slew_violations, int length_violations,
                       int cap_violations, int fanout_violations,
                       int inserted_buffer_count, int resize_instance_count, bool before);

// 建立时间优化报告
void reportSetupResult(std::vector<double> slack_store);

// 保持时间优化报告
void reportHoldResult(vector<double> hold_slacks, vector<int> hold_vio_num,
                        vector<int> insert_buf_num, double slack, int insert_buf);
```

### 2.3 子模块设计

> **描述软件的各个组成子模块的设计，独立完成功能，相互依赖关系等。这些模块的情况**

这部分主要介绍 iTO 的几个工具模块，主要包括：绕线评估模块、RC树评估模块、单元摆放合法化模块、结果报告模块以及输出 GDS 文件模块。

#### 2.3.1 绕线评估模块（RoutingTree）

该模块对线网进行绕线评估，并产生绕线拓扑。绕线方法主要通过开源绕线器 FLUTE 和 HV-Tree 绕线算法，FLUTE 是一种基于查找表的构建直角斯坦纳树方法，HV-Tree 首先计算垂直方向重心，并以此重心作为树干，最后将所有 pin 点水平连接到此树干上。两种方法的绕线拓扑如以下示例所示：

![image.png](https://images.gitee.com/uploads/images/2022/0524/213903_a4142a1b_5376247.png)

上图中间为 FLUTE 绕线拓扑，右边为 HV-Tree 绕线拓扑。

调用绕线拓扑方式如下：

```
RoutingTree *makeRoutingTree(Net *net, TimingDBAdapter *db_adapter, RoutingType rout_type);
enum class RoutingType : int { kHVTree = 0, kSteiner = 1};
```

在调用时需要指定线网，以及绕线方法，通过 TimingDBAdapter 获得线网上每个 pin 点的位置信息。RoutingTree 是一个多叉树结构，它始终以 驱动pin 作为根节点，负载pin 作为叶节点，斯坦纳点作为中间节点。

#### 2.3.2 RC树评估模块（EstimateParasitics）

iTO 依赖于 iSTA 工具提供的时序信息，在更新时序信息之前需要更新每条线网的 RC树 信息。在更新 RC树 之前需要调用绕线评估模块以产生绕线拓扑，同时根据绕线拓扑更新每个 pin 点之间的连线电容电阻信息。

RC树评估模块使用方式如下：

```
EstimateParasitics *parasitics_estimator = new EstimateParasitics(_db_interface);
// 更新所有线网的 RC树 信息
parasitics_estimator->estimateAllNetParasitics();
// 更新指定线网
parasitics_estimator->estimateNetParasitics(Net *net)'
```

RC树评估模块同样从 DbInterface 类中获得所需数据，因此通过 DbInterface 进行初始化。RC树评估模块提供更新所有线网和指定线网的接口。在更新RC树信息之后需要调用 iSTA 工具中的 `updateTiming()` 方法，这样才能更新整个网表的时序信息。

#### 2.3.3 单元摆放合法化模块（Placer）

单元在摆放时需要满足单元之间无重叠，行对齐和site对齐的规则，单元摆放合法化模块将单元合法的摆放在指定位置的附近。

Placer 通过 iDB 对芯片上已放置单元的位置进行标记，提供三个对外接口，分别如下：

```
// 输入：单元宽度、理想放置位置
// 输出：合法放置位置，左下角坐标
pair<int, int> findNearestSpace(unsigned int master_width, int loc_x, int loc_y);

// 更新芯片上已放置单元的位置信息
void updateRow(unsigned int master_width, int loc_x, int loc_y);

// 返回该位置所在行，之后通过 iDB 判断单元放置的方向
IdbRow *findRow(int loc_y);
```

#### 2.3.4 时序设计规则违例优化模块（ViolationOptimizer）

![image.png](https://images.gitee.com/uploads/images/2022/0524/222623_8b462f51_5376247.png)

时序设计规则约束主要是指最大转换时间约束(max_transition)、最大电容(max_cap)约束和最大扇出(max_fanout)约束。前两个是硬性条件，在签核阶段必须满足要求。不满足时需设计规则约束时就会发生时序设计规则违例(Design Rule Violation, DRV)。该模块的主要功能是进行时序设计规则违例优化，优化的方式为 单元尺寸调整和插入缓冲器。主要步骤如下：

1. 时序更新
2. 违例线网检查
3. 违例线网优化

是否进行时序设计规则违例优化由配置 json 文件中的 `"optimize_drv"` 参数指定。在准备阶段需要确定插入的缓冲器类型，用户可以通过配置 json 文件中的 `"DRV_insert_buffer"` 参数指定，如果不指定将会由工具自主选择，工具会选择可用缓冲器中驱动电阻最大的缓冲器。

```
void ViolationOptimizer::initBuffer() {
  // 判断是否由用户指定缓冲器
  bool specified_buffer = _db_interface->get_drv_insert_buffer().empty();
  _insert_buffer_cell = specified_buffer
                            ? _db_interface->get_lowest_drive_buffer()
                            : _timing_engine->findLibertyCell(
                                  _db_interface->get_drv_insert_buffer().c_str());
}
```

工具自主选择的缓冲器在 DbInterface 类中实现，实现内容如下：

```
void DbInterface::findBufferCells() {
  _lowest_drive_buffer = nullptr;
  float low_drive = -kInf;

  auto &all_libs = _timing_engine->getAllLib();
  for (auto &lib : all_libs) {
    for (auto &cell : lib->get_cells()) {
      // 遍历所有可用缓冲器
      if (cell->isBuffer() && isLinkCell(cell.get())) {
        _buffer_cells.push_back(cell.get());

        LibertyPort *in_port;
        LibertyPort *out_port;
        cell->bufferPorts(in_port, out_port);
        float drvr_res = out_port->driveResistance();
        if (drvr_res > low_drive) {
          low_drive = drvr_res;
	  // 由工具选择的缓冲器
          _lowest_drive_buffer = cell.get();
        }
      }
    }
  }
  if (_buffer_cells.empty()) {
    std::cout << "No buffers found." << std::endl;
    exit(1);
  }
}
```

时序设计规则违例优化需要更新时序信息，此时需要调用 **RC树评估模块（EstimateParasitics）**和 **iSTA工具**

```
  _parasitics_estimator->estimateAllNetParasitics();
  _timing_engine->updateTiming();
```

在更新完时序信息之后，对每条线网进行时序设计规则检查，并对出现 DRV 的线网进行优化

```
  int       number_drvr_vertices = _db_interface->get_drvr_vertices().size();
  VertexSeq _level_drvr_vertices = _db_interface->get_drvr_vertices();

  int                net_connect_port = 0;
  list<const char *> net_name = {"_00_"};

  // 线网从高层级往低层级顺序进行优化
  for (int i = number_drvr_vertices - 1; i >= 0; --i) {
    StaVertex *drvr = _level_drvr_vertices[i];

    auto *design_obj = drvr->get_design_obj();
    auto *net = design_obj->get_net();

    // do not fix clock net
    if (net->isClockNet()) {
      continue;
    }

    if (netConnectToPort(net)) {
      net_connect_port++;
      continue;
    }

    if (!drvr->is_clock() && !drvr->is_const()) {
      // 该函数包含检查和优化功能
      repairViolations(net, drvr, _check_slew, _check_cap, repair_count, slew_violations,
                       cap_violations, length_violations);
    }
  }
```

`_db_interface->get_drvr_vertices()` 接口所获得的数据由 DbInterface 类中的 `findDrvrVertices()` 函数实现，该函数遍历所有线网，获得所有的驱动pin，并根据层级将这些驱动pin 进行升序排序，在进行 DRV优化时需要从高层级往低层级的顺序进行优化，避免之后的优化结果影响到前面已经优化过的线网。上面的最后一行代码 `repairViolations(...)` 包含违例检查和优化功能，违例检查函数为：

```
// 检查是否存在Capacitance违例情况
checkCapacitanceViolation(drvr_pin_port, max_drvr_cap, cap_violations, repair_cap);
// 检查是否存在Slew违例情况
checkSlewViolation(drvr_pin_port, max_drvr_cap, slew_violations, repair_slew);
```

在检查到存在Capacitance违例或Slew违例情况时，需要对该线网进行优化，优化的函数如下：

```
void ViolationOptimizer::fixViolations(RoutingTree *tree, int curr_pt, int prev_pt,
                                       Net *net, float max_cap, int level,
                                       // Return values.
                                       // Remaining parasiics after repeater insertion.
                                       int &  wire_length, // dbu
                                       float &pin_cap, DesignObjSeq &load_pins)
```

优化的主要方式为单元尺寸调整和插入缓冲器，缓冲器插入需要提供位置和连接的pin点信息，因此需要调用**绕线评估模块（RoutingTree）**产生绕线拓扑，并在此拓扑的基础上进行DRV优化

```
// 插入缓冲器实现函数
void ViolationOptimizer::insertBuffer(int x, int y, Net *net,
                                      LibertyCell *insert_buf_cell, int level,
                                      int &wire_length, float &cap,
                                      DesignObjSeq &load_pins)

// 单元尺寸调整实现函数
bool ViolationOptimizer::repowerInstance(Pin *drvr_pin)
```

在插入缓冲器时需要调用**单元摆放合法化模块（Placer）**，在给定位置附近找到一个最近的合法位置进行摆放。单元摆放合法化会导致理想的缓冲器插入位置发生变化，这可能会导致部分线网的 DRV 没有完全优化，因此还需要进行二次检查和优化：

```
// ===================test if there are still violations===================
  checkViolations();

  if (!_still_violation_net.empty()) {
    // If there are still a violation nets, the secondary fix is performed.
    for (auto net : _still_violation_net) {
      DesignObject *driver = net->getDriver();
      StaVertex *   drvr = _timing_engine->findVertex(driver->getFullName().c_str());

      repairViolations(net, drvr, _check_slew, _check_cap, repair_count, slew_violations,
                       cap_violations, length_violations);
    }
    _timing_engine->updateTiming();
    checkViolations();
  }
```

最后调用 结果报告模块（Reporter）可生成 DRV优化 结果报告

```
void Reporter::reportDRVResult(int repair_count, int slew_violations,
                               int length_violations, int cap_violations,
                               int fanout_violations, int inserted_buffer_count,
                               int resize_instance_count, bool before)
```

#### 2.3.5 保持时间优化模块（HoldOptimizer）

![image.png](https://images.gitee.com/uploads/images/2022/0526/003339_a1f06b7b_5376247.png)

该模块实现保持时间优化功能，主要优化方式为插入延时缓冲器。主要步骤如下：

* 时序更新
* 违例路径定位
* 违例线网优化

是否进行保持时间优化由配置 json 文件中的 `"optimize_hold"` 参数指定。为了尽量减少插入的缓冲器个数，在开始阶段该模块会选择延时最大的缓冲器，用户可以通过配置 json 文件中的 `"hold_insert_buffer"` 参数指定一些候选的缓冲器，如果不指定该参数工具将在所有可用的缓冲器中进行选择。

```
// 初始化缓冲器候选库
void HoldOptimizer::initBufferCell() {
  LibertyCellSeq buf_cells = _db_interface->get_buffer_cells();
  auto hold_bufs = _db_interface->get_hold_insert_buffer();
  if (hold_bufs.empty()) {
    _buffer_cells = buf_cells;
  } else {
    for (auto buf : hold_bufs) {
      LibertyCell *cell = _timing_engine->findLibertyCell(buf.c_str());
      _buffer_cells.emplace_back(cell);
    }
  }
}

// 选择具有最大延时的缓冲器
LibertyCell *HoldOptimizer::findBufferWithMaxDelay() {
  LibertyCell *max_delay_buf = nullptr;
  float        max_delay = 0.0;

  for (LibertyCell *buffer : _buffer_cells) {
    // 避免使用时钟信号的缓冲器
    if (strstr(buffer->get_cell_name(), "CLK") != NULL) {
      continue;
    }
    float buffer_delay = getBufferHoldDelay(buffer);
    if (max_delay_buf == nullptr || buffer_delay > max_delay) {
      max_delay_buf = buffer;
      max_delay = buffer_delay;
    }
  }
  // 选择最大延时的缓冲器
  return max_delay_buf;
}
```

与时序设计规则违例优化模块一样，该模块同样需要更新时序信息，此时需要调用 RC树评估模块（EstimateParasitics）和 iSTA工具

```
  _parasitics_estimator->estimateAllNetParasitics();
  _timing_engine->updateTiming();
```

保持时间优化模块遍历所有端点并找出出现保持时间违例的端点：

```
void HoldOptimizer::findEndpointsWithHoldViolation(VertexSet end_points,
                                                   // return values
                                                   Slack &    worst_slack,
                                                   VertexSet &hold_violations) {
  worst_slack = kInf;
  hold_violations.clear();

  for (auto *end : end_points) {
    Slack slack = getWorstSlack(end, AnalysisMode::kMin);
    worst_slack = min(worst_slack, slack);
    // 保持时间裕量低于所设置值，视为出现保持时间违例
    if (!end->is_clock() && fuzzyLess(slack, _slack_margin)) {
      hold_violations.insert(end);
    }
  }
}
```

同时找到这些违例端点的扇入pin点，并在该段线网上插入缓冲器

```
// 找出违例端点的扇入
VertexSet HoldOptimizer::getFanins(VertexSet end_points)

// 插入延时缓冲器
void HoldOptimizer::insertBufferDelay(StaVertex *drvr_vertex, int insert_number,
                                      DesignObjSeq &load_pins,
                                      LibertyCell * insert_buffer_cell)
```

最后调用 结果报告模块（Reporter）可生成保持时间优化结果报告

```
void Reporter::reportHoldResult(vector<double> hold_slacks, vector<int> hold_vio_num,
                                vector<int> insert_buf_num, double slack,
                                int insert_buf)
```

#### 2.3.6 建立时间优化模块（SetupOptimizer）

![image.png](https://images.gitee.com/uploads/images/2022/0526/003118_5a6c1ca0_5376247.png)

该模块实现建立时间优化功能，主要优化方式为单元尺寸调整和插入缓冲器。主要步骤如下：

* 时序更新
* 违例路径定位
* 违例线网优化

与其他优化模块相同，是否进行建立时间优化由配置 json 文件中的 `"optimize_setup"` 参数指定。建立时间优化模块包含两个类，一个为 SetupOptimizer ，另一个为 BufferedOption。其中 BufferedOption 类用来记录缓冲器插入算法的候选解。缓冲器插入包括两部分，缓冲器插入算法、缓解多扇出：

```
// 基于缓冲器插入算法
if (fanout > 1
    // Rebuffer blows up on large fanout nets.
     && fanout < _rebuffer_max_fanout) {
  int count_before = _inserted_buffer_count;
  // 缓冲器插入算法，用于降低线网延时
  buffering(drvr_pin);
}


// 缓解多扇出
if (fanout > split_load_min_fanout) {
    insertBufferSeparateLoads(drvr_vertex, path_slack);
}
```

缓冲器插入算法基于 **最差时序路径** 上的线网，每次对最差时序路径进行优化之后，需要重新更新时序信息，以获得新的最差时序路径：

```
// 获得最差时序路径以及建立时间裕量
StaSeqPathData *worst_path = _timing_engine->vertexWorstRequiredPath(AnalysisMode::kMax, TransType::kRise);
Slack worst_slack = worst_path->getSlackNs();


while (fuzzyLess(worst_slack, slack_margin)) {
  // 建立时间优化
  optimizeSetup(worst_path, worst_slack); 

  // 对路径上的线网进行优化之后需要重新更新时序
  _parasitics_estimator->excuteParasiticsEstimate();
  _timing_engine->updateTiming();

  // 时序更新之后的最差时序路径
  worst_path = _timing_engine->vertexWorstRequiredPath(AnalysisMode::kMax, TransType::kRise);
  worst_slack = worst_path->getSlackNs();

  // 优化后的建立时间裕量比优化前的差
  if (fuzzyLessEqual(worst_slack, prev_worst_slack)) {
    // excessive slack increase is prohibited
    float diff = prev_worst_slack - worst_slack;
    if (diff > 0.02 * abs(prev_worst_slack)) {
      break;
    }

    // 允许建立时间裕量持续变差的最大更新次数，防止陷入持续负优化
    decreasing_slack_passes++;
    if (decreasing_slack_passes > _number_passes_allowed_decreasing_slack) {
      break;
    }
  }
}
```

其中参数 `_number_passes_allowed_decreasing_slack` 即为允许建立时间裕量持续变差的最大更新次数，该值可通过在配置 json 文件中的 "`number_passes_allowed_decreasing_slack"` 进行指定。

最后调用 结果报告模块（Reporter）可生成建立时间优化结果报告

```
void Reporter::reportSetupResult(std::vector<double> slack_store)
```

### 2.4 评价指标

* **线长 HPWL**
* **线长光滑化：SA**
* **Bellshap:**
* **电场能：**
* **时序：**
* **可布线性：**

### 2.5 算法设计

> **描述软件用到的主要算法，可以用伪代码的形式描述。**

* 缓冲器插入算法（VG算法）Buffer placement in distributed RC-tree networks for minimal Elmore delay

### 2.6 数据结构设计

> **描述用到的主要数据结构，包括类的设计，继承关系等等。**

## 3. 接口设计

### 3.1 外部接口

> **包括用户界面、软件接口。**

### 3.2 内部接口

> **内部模块之间的接口。**

## 4. 测试报告

### 4.1 测试环境

> *描述测试环境。*

### 4.2 测试结果

> **描述测试人员应该覆盖的功能点**

| **测试****编号** | **测试****版本** | **测试功能点** | **测试****描述** |
| ---------------------- | ---------------------- | -------------------- | ---------------------- |
| **TR01**         | **V1.0**         |                      |                        |
| **…**           | **…**           | **…**         | **…**           |

### 4.3 比对

*图、表描述与第三方的性能比对。*

## 5. TO BE DONE

### 5.1 疑难问题

> *描述重点难点问题* ；
>
> *说明在开发过程中遇到的问题，以及解决方法。例如：方法的选择、参数的处理、需要说明的其他具体问题。如果有不能正常工作的模块，说明具体情况，猜测可能的原因。*

### 5.2 待研究

> *待研究问题；*
