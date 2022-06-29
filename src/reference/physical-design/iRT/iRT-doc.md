# iEDA-RT软件设计说明书

**编制：** iEDA布线组

**审核：** iEDA课题组

**时间：**

---

## 版本修改历史

| 版本号 | 日期       | 作者 | 简要说明 |
| ------ | ---------- | ---- | -------- |
| 0.10   | 202x-xx-xx |      |          |
|        |            |      |          |
|        |            |      |          |
|        |            |      |          |
|        |            |      |          |

---

# 1. 简介

**背景**

![布线在物理设计中的位置](https://images.gitee.com/uploads/images/2022/0527/122207_1dccbcf1_1004707.png "0897178917f3748302ec655a8174aa9.png")
布线是继布局和时钟树综合之后的重要物理实施任务，其内容是将分布在芯片核内的模块，标准单元和输入输出接口单元按逻辑关系进行互连，并为满足各种约束条件进行优化。iRT是iEDA课题组针对布线阶段设计的一款布线器，其内部集成了全局布线和详细布线。

**编写目的**

本文挡将主要介绍iRT工具内部各个模块的作用，数据结构，主要程序流程以及模块间的调用关系。

**目标读者**

使用iRT的用户（标题2之前），iRT的开发者（标题2及之后）。

## 1.1 设计需求和目标

**需求**

在所有线网都连通的情况下，生成没有DRC，LVS等规则违例的布线结果。

**目标**

* 没有连通的线网个数为0
* DRC违例个数为0
* 满足时序约束
* 总线长最短
* 总通孔数最少

## 1.2 专有名词

| **名词（缩写）**         | **定义（中文名，解释或包含的属性，作用）**                          |
| ------------------------------ | ------------------------------------------------------------------------- |
| Global Routing (GR)            | 全局布线                                                                  |
| Detail Routing (DR)            | 详细布线                                                                  |
| Pin Access (PA)                | PinAccess模块名，也可指代AP点                                              |
| Access Point (AP)              | Pin上的可接入点，包含x-y坐标，一般作为布线的起点或终点                     |
| Region Ripup & Rerouting (RRR) | 区域拆线重布                                                              |

## 1.3 参考文档

### 1.3.1 全局布线

[1][GR拆解文档](https://ieda.yuque.com/kzqyb5/tga6ng/8274755)
[2]FastRoute: An efficient and high-quality global router
[3]CUGR: Detailed-routability-driven 3D global routing with probabilistic resource model.
[4]FLUTE: Fast lookup table based rectilinear steiner minimal tree algorithm for VLSI design

### 1.3.2 详细布线

[1][DR开发文档](https://ieda.yuque.com/kzqyb5/no8a7o/sdxppp)
[2]Negotiation-Based Track Assignment Considering Local Nets
[3]TritonRoute-WXL: The Open-Source Router With Integrated DRC Engine
[4]TritonRoute: The Open-Source Detailed Router
[5]Dr. CU: Detailed Routing by Sparse Grid Graph and Minimum-Area-Captured Path Search

## 1.4 使用说明

### 1.4.1 运行环境设置

运行iRT需要文件POWV.dat，POST.dat，slute.txt，请将这些文件与iRT的可执行文件放到同一目录下。

### 1.4.2 配置文件设置

iRT的默认配置文件为irt_default_config.json，该配置位于iEDA/src/iPlatform/default config下 需要对里面的路径进行设置才能使用。内部分为总体设置（flow，lef，def等输入输出文件路径）和模块设置（GridManager，ResourceAllocator等内部模块），下面将描述这些字段的作用以及如何进行配置。

* 总体设置

```json
{
    "RT": {
        "flow": [ //iRT集成了GR和DR，可以在flow里控制单独运行GR，单独运行DR或GR-DR集成运行
            "GR",
            "DR"
        ],
        "lef_file_list": [ //lef文件路径，由于iDB的读取机制，tech_lef必须要在第一个
            "<tech_lef_file_path>",
            "<lef_file_path1>",
            "<lef_file_path2>"
        ],
        "def_file": "<def_file_path>", //输入def文件路径
        "guide_file": "<guide_file_path>", //GR输出guide文件路径或DR输入guide文件路径
        "output_def_file": "<output_def_file_path>",//DR输出def文件路径
        "temp_directory": "<temp_directory_path>", //临时文件夹路径，主要用于存储运行时临时数据
  
        .............."模块设置"..............

    }
}
```

* 模块设置
  
  - GridManager
  
  ```json
  "GridManager": {
            "global_utilization_ratio": 1, //全局利用率
            "layer_utilization_ratio": { //单层利用率
                "METAL1": 0
            }
      },
  ```
  
  - ResourceAllocator
  
  ```json
  "ResourceAllocator": {
            "number_of_frame_levels": 1, //多层框架级数（暂不可用）
            "initial_penalty_para": 100, //梯度下降算法的初始罚参数
            "penalty_para_drop_rate": 0.8, //梯度下降算法的下降率
            "max_outer_iter_num": 10, //梯度下降算法的外层最大迭代次数
            "max_inner_iter_num": 50 //梯度下降算法的内层最大迭代次数
        },
  ```
  
  - PlaneRouter
  
  ```json
  "PlaneRouter": {
            "single_enlarge_range": 10, //扩区域布线的单次扩大范围，，GCell为单位
            "max_enlarge_times": 10, //扩区域布线的最大扩大次数
            "max_lut_capicity": 99999, //最大查找表能力（暂不可用）
            "resource_weight": 3, //资源权值权重
            "congestion_weight": 1 //拥塞权值权重
        },
  ```
  
  - LayerAssigner
  
  ```json
  "LayerAssigner": {
            "max_segment_length": 1, //单次移动的最大线段长度，GCell为单位
            "via_weight": 1, //通孔权值权重
            "congestion_weight": 1 //拥塞权值权重
        },
  ```
  
  - TrackAssigner
  
  ```json
  "TrackAssigner": {
            "adjacent_segment_ratio": 0.1, //同线网权重
            "connect_pin_ratio": 1, //同线网Pin的权重
            "pin_obs_ratio": 0.5, //其他线网Pin权重
            "pa_cost": 0.5, //同线网AP点权重
            "overlap_ratio": 100, //重叠权重
            "drc_ratio": 10000 //DRC权重
        },
  ```
  
  - RegionRouter
  
  ```json
  "RegionRouter": {
            "routing_size": 1,//绕线基本Gcell单位
            "gcell_size": 6560,//Gcell大小
            "grid_cost": 1,//cost_map中格点cost值
            "around_cost": 50,//cost_map中某点扩散的cost值
            "via_cost": 20,//cost_map中打下Via的cost值
            "drc_cost": 100//cost_map中发生DRC的cost值
        },
  ```
  
  - SpaceRouter
  
  ```json
  "SpaceRouter": {
            "routing_size": 1,//绕线基本Gcell单位
            "gcell_size": 6150//Gcell大小
        },
  ```
  
  - ExternalInteractor
  
  ```json
  "ExternalInteractor": {
            "ipa_config_file": "<ipa_config_file_path>", //iPA的配置文件
            "sta_workspace": "<sta_workspace_path>", //iSTA的工作路径
            "sdc_file": "<sdc_file_path>", //sdc的文件路径
            "lib_file_list": [ //时序lib的文件路径
                "<lib_file_path1>", 
                "<lib_file_path2>",
                "<lib_file_path3>"
            ]
        }
  ```
* 程序运行：编译iRT后将产生可执行文件run_rt，需要通过以下方式启动。

```shell
run_rt <irt_config_path>
```

# 2. 整体设计

## 2.1 总体架构

![iRT架构图](https://images.gitee.com/uploads/images/2022/0527/192811_c63fc6ab_1004707.png "iRouter架构.png")

* irt_config.json：iRT配置文件
* iDB：顶层数据来源
* data_manager：iRT的数据管理模块，主要管理Database和Config
* Config：Config类，用于存储iRT配置（包括子模块配置）
* Database：用于存储iRT需要的所有数据（包括但不限于Die，Layer，Net等）
* ExternalInteractor：外部接口类，用于iRT与外部工具交互
* OP：算子库，存储算法（如A*，ILP等）
* Utility：公共库，存储日志工具，工具类，测试类等
* interface：与外部交互的工具

- **全局布线模块**
  * GridManager：网格管理器，用于管理被GCell划分的网格
  * ResourceAllocator：资源分配器，用于在布线前给线网分配资源
  * PlaneRouter：平面绕线器，用于生成线网的二维布线结果
  * LayerAssigner：层分配器，将二维布线结果分配到三维
- **详细布线模块**
  * PinAccessor：pin接入器，在pin上找到详细布线可以接入的点
  * GuideProcessor：guide处理器，用于处理全局布线结果guide
  * RegionManager：区域管理器，用于存储绕线层以上的所有金属
  * TrackAssignment：对Net的区域生成Seg，并且对每条seg分配track，要求避障，最小化重
  * RegionRouter：从第二层开始每两层进行绕线，获得绕线初始解
  * SpaceRouter：对指定区域中的线网或者指定线网进行空间绕线获得最终解

## 2.2 软件流程

![输入图片说明](https://images.gitee.com/uploads/images/2022/0528/123721_8a9e3a02_1004707.png "LDPC.png")

* init()：用于初始化iRT的Config，Database和各个子模块。

```cpp=
void RT::init(std::string& rt_config_path, PCL::iDB::IdbBuilder* idb_builder)
{
  double start, end;
  start = COMUtil::microtime();

  printLogo();
  _data_manager.input(rt_config_path, idb_builder);

  Config* config = &_data_manager.getConfig();
  Database* database = &_data_manager.getDatabase();

  GridManager::getInst(config, database);
  TopoGenerator::getInst(config, database);
  ResourceAllocator::getInst(config, database);
  PlaneRouter::getInst(config, database);
  LayerAssigner::getInst(config, database);
  ExternalInteractor::getInst(config, database);
  PinAccessor::getInst(config, database);
  GuideProcessor::getInst(config, database);
  TrackAssigner::getInst(config, database);

  end = COMUtil::microtime();
  Logger::info("RT", "Total initialization time: ", (end - start), "s");
}
```

* run()：iRT的主要流程，里面多个模块在作用，模块的输入为iRT顶层数据，输出通常是Net数据结构内的某个数据。

```cpp=
void RT::run()
{
  double start, end;
  start = COMUtil::microtime();

  Config* config = &_data_manager.getConfig();
  Database* database = &_data_manager.getDatabase();
  std::vector<Net>& net_list = _data_manager.getDatabase().get_net_list();

  ResourceAllocator::getInst().allocate(net_list);
  PrioritySorter::getInst().sort(SortType::kBBoxHPWL, net_list);

  irt_int batch_size = COMUtil::getBatchSize(net_list.size());

  for (size_t i = 0; i < net_list.size(); i++) {
    Net& net = net_list[i];
    PlaneRouter::getInst().route(net);
    LayerAssigner::getInst().assign(net);
    if ((i + 1) % batch_size == 0) {
      GridManager::getInst().checkResourceMap();
      Logger::info("RT", "Processed ", (i + 1), " nets");
    }
  }

  GridManager::getInst().checkResourceMap();
  Logger::info("RT", "Processed ", net_list.size(), " nets(total)");

  GridManager::getInst().printPlaneResourceMap();
  GridManager::getInst().printSpaceResourceMap();
  GridManager::getInst().reportResourceMap();

  _data_manager.outputGuide();
  // sort net_idx
  sortNetIdx(net_list);
  // ExternalInteractor::getInst().reportTiming(_data_manager.getAuxInfo().get_idb_builder(), net_list);

  ExternalInteractor::getInst().initPAPoint(_data_manager.getAuxInfo().get_idb_builder());

  PinAccessor::getInst().access(net_list);
  PinAccessor& pin_accessor = PinAccessor::getInst();
  pin_accessor.access(net_list);
  PinAccessor::delInst();
  // Guide
  GuideProcessor::getInst().processorGuide(net_list);
  GuideProcessor::delInst();
  // TA
  AssignTrackType ta_type = AssignTrackType::kGreddy;
#ifdef BUILD_GUROBI
  ta_type = AssignTrackType::kILP;
#endif
  TrackAssigner::getInst().assignTrack(net_list, ta_type);
  TrackAssigner::delInst();
  // _data_manager.output(NetProcessStage::kTrackAssigner);
  // RR
  // _drc = _db_wrapper->get_drc();

  // _data_manager.output(NetProcessStage::kTrackAssigner);
  // RR
  // _drc = _db_wrapper->get_drc();

  ExternalInteractor::getInst().initDRC(_data_manager.getAuxInfo().get_idb_builder());
  // ExternalInteractor::getInst().checkDRC({1, 2}, region, dr_node_list);
  RegionRouter& region_router = RegionRouter::getInst(config, database);
  region_router.debugWriteGdsForNet();
  region_router.topoBuilder();
  region_router.areaRouter();
  _data_manager.outputDef(NetProcessStage::kRegionRouter);

  end = COMUtil::microtime();
  Logger::info("RT", "Total run time: ", (end - start), "s");
}
```

* destroy()：用于销毁模块和iRT，防止内存泄露。

```cpp=
void RT::destroy()
{
  RegionManager::delInst();
  GridManager::delInst();
  TopoGenerator::delInst();
  ResourceAllocator::delInst();
  PlaneRouter::delInst();
  LayerAssigner::delInst();
  GuideProcessor::delInst();
  TrackAssigner::delInst();
  RegionRouter::delInst();
  SpaceRouter::delInst();
  ExternalInteractor::delInst();
}
```

## 2.3 子模块设计

所有子模块（SubModule）与顶层（Top）的交互以及子模块的架构如下图所示。

![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/210345_a8b81904_1004707.png "Snipaste_2022-06-02_21-03-32.png")

### 2.3.1 ExternalInteractor

* 设计思路
  
  为方便管理，将整个iRT与外部工具交互的接口都封装在ExternalInteractor内，交互模式从“内部模块-外部工具”变为“内部模块-ExternalInteractor-外部工具”。
* 功能描述
  
  * 与iPA交互，在GR前确定pa点
  * 与iDRC交互，在布线时
  * 与iSTA交互，报告时序
* 主要流程图
  
  此模块为接口交互模块，无主要流程。
* 可调用接口
  
  ```cpp
  // PA
   // 启动外部工具ipa来初始化_net_pin_pa_map数据
   void initPAPoint(PCL::iDB::IdbBuilder* idb_builder);
  
   // 双层检索，首先是net_name，之后是pin_name，返回的是线网（net_name）下的pin（pin_name）的所有pa点
   std::vector<PAPoint> getPAPoint(std::string net_name, std::string pin_name);
  
   // DRC
   // 初始化外部工具DRC
   void initDRC(PCL::iDB::IdbBuilder* idb_builder);
  
   /**
    * check_layer_set 需要检查的层 集合
    * region 检查的区域
    * rr_node_list 由rr node组成的wire和via集合
    */ 
   std::vector<pair<RRDRNode*, RRDRNode*>> checkDRC(std::set<irt_int> check_layer_set, Rectangle<irt_int> region,
                                                std::vector<RRDRNode>& rr_node_list);
   // Timing
   // 报告对应线网的时序
   void reportTiming(PCL::iDB::IdbBuilder* idb_builder, std::vector<Net>& net_list);
   void reportTiming(std::vector<Net>& net_list);
  ```

### 2.3.2 GridManager

* 设计思路
  
  本模块主要用于在全局布线进行统一的网格资源管理。
* 功能描述
  
  * 构建网格模型
  * 初始化网格资源
  * 计算障碍物对网格的影响
* 主要流程图
  
  此模块为管理类型模块，无主要流程。
* 可调用接口
  
  ```cpp=
  // 更新资源图
  void updatePlaneMap(irt_int origin_net_idx, MTree<GRNode>& tree);
  void updateSpaceMap(irt_int origin_net_idx, MTree<GRNode>& tree);
  
  // 判断（x，y）是否为障碍
  bool isPlaneOBS(ResourceType resource_type, irt_int x, irt_int y);
  bool isSpaceOBS(ResourceType resource_type, irt_int x, irt_int y, irt_int layer_idx);
  
  // 获取（x，y）的剩余资源
  irt_int getPlaneRemaining(ResourceType resource_type, irt_int x, irt_int y);
  irt_int getSpaceRemaining(ResourceType resource_type, irt_int x, irt_int y, irt_int layer_idx);
  
  // 获得（x，y）的COST，在不同方向上
  double getPlaneCost(ResourceType resource_type, irt_int x, irt_int y);
  double getSpaceCost(ResourceType resource_type, irt_int x, irt_int y, irt_int layer_idx);
  
  // 检查二维资源与三维资源一致
  void checkResourceMap();
  
  // 清除资源图
  void clearResourceMap();
  
  // 报告资源图
  void reportResourceMap();
  ```

### 2.3.3 ResourceAllocator

* 设计思路
  
  本模块主要用于在二维布线前，为线网分配资源，以缓解由于布线资源争抢导致的拥塞。
  
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/202955_3847497a_1004707.png "Snipaste_2022-06-02_20-28-49.png")
  
  在初始状态下，每个线网区域内的布线概率是均匀的，虽然每个线网是均匀分布，但是这导致在全局状态下是有叠加的出现。叠加的部分在布线时会有潜在的布线冲突，这会导致拥塞的出现。为此，我们将这个模型建模为二次规划问题，并通过梯度下降来对资源进行分配。分配结束后，全局的资源分配结果是均匀的，但是对于每个线网内的资源分配是不均匀的。线网内的分配结果转换为权值图来指导布线。
* 功能描述
  
  * 估计线网需求
  * 构建迭代模型
  * 使用梯度下降求解资源分配
  * 将资源图转换为资源代价图
* 主要流程图
  
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/142854_b9fc1739_1004707.png "Snipaste_2022-06-02_14-28-19.png")
* 可调用接口
  
  ```cpp=
  // 对线网集合进行资源分配
  void ResourceAllocator::allocate(std::vector<Net>& net_list)
  ```

### 2.3.4 PlaneRouter

* 设计思路
  
  本模块主要用于对线网进行二维布线。
  
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/201301_6999248a_1004707.png "Snipaste_2022-06-02_20-12-27.png")
  
  首先结合结合资源分配的结果和拥塞图，构建每个线网对应的布线权值图。随后进行相对位置压缩，将压缩后的标准化点组合在iSR（一个可以构建多个候选斯坦纳树的工具）中查找。从里面找到的最小权值就是需要的候选斯坦纳树。在将获得的斯坦纳树反向映射到布线图上，再将拓扑分解为多个两点线网并分别进行加权布线。
* 功能描述
  
  * 通过iSR生成线网拓扑
  * 对拓扑解构进行两点布线
  * 对所有两点布线进行以下算法
    - L型布线
    - Z型布线
    - 内部三拐弯布线
    - 动态模式布线
    - U型布线
    - 外部三拐弯布线
    - A*布线
* 主要流程图
  
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/142901_11b6a4ff_1004707.png "Snipaste_2022-06-02_14-28-31.png")
* 可调用接口
  
  ```cpp=
  // 对线网集合进行二维布线
  void PlaneRouter::route(std::vector<Net>& net_list);
  ```

### 2.3.5 LayerAssigner

* 设计思路
  
  本模块主要用于将线网的二维布线结果分配到三维上（布线层上）。
  
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/201801_38bd8964_1004707.png "Snipaste_2022-06-02_20-17-46.png")
  
  在二维布线结束后，线网有一个对应的二维结果，我们通过动态规划来将二维结果分配到三维上，并在分配过程中最大限度地降低通孔数量。
* 功能描述
  
  * 构建层分配树
  * 从层分配树根节点传播通孔数量
  * 从树叶子节点回溯通孔数量（动态规划）
  * 构建三维树
* 主要流程图
  
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/232447_ade2c5d9_1004707.png "Snipaste_2022-06-02_23-24-30.png")
* 可调用接口
  
  ```cpp=
  // 对线网集合进行层分配
  void LayerAssigner::assign(std::vector<Net>& net_list);
  ```

### 2.3.6 PinAccessor

* 设计思路
  ![输入图片](https://images.gitee.com/uploads/images/2022/0605/111614_85ece724_10974145.png "pa.png")
  
  - 本模块主要用于选取pin上供金属线(wire/segment)连接的连接点pin accessor(pa点)。
  - 优化目标：希望pa点尽可能选在track交点上(pa点不在track交点上时，通过打补丁(jog)偏移到pin周围的track交点上)，并且pa点与周围其他pin上的pa点的冲突尽可能小。
* 功能描述
  
  * 计算 pin 的候选 pa 点，进行合法性检查，并获得合法的 via。
  * 计算不同 pin 的候选 pa 点之间的冲突关系。
  * 使用贪婪算法，计算每个 pin 最优的 pa 点。
  * 针对非 onGrid 类型的 pa 点生成 Jog。
* 主要流程图<br/>

<img src="https://images.gitee.com/uploads/images/2022/0531/161347_5eb9bdb4_1004707.png" width="45%">

* 可调用接口

```cpp=
PinAccessor& PinAccessor::getInst(Config* config, Database* database)
{
  if (pa_instance == nullptr) {
    pa_instance = new PinAccessor(config, database);
  }
  return *pa_instance;
}

void PinAccessor::delInst()
{
  delete pa_instance;
  pa_instance = nullptr;
}

void PinAccessor::access(std::vector<Net>& net_list)
{
  double start;
  double end;

  start = COMUtil::microtime();

  irt_int batch_size = COMUtil::getBatchSize(net_list.size());

  for (size_t i = 0; i < net_list.size(); i++) {
    Net& net = net_list[i];
    access(net);

    if ((i + 1) % batch_size == 0) {
      end = COMUtil::microtime();
      Logger::info("PinAccessor", "Processed ", (i + 1), " nets: ", (end - start), "s");
    }
  }

  end = COMUtil::microtime();
  Logger::info("PinAccessor", "Processed ", net_list.size(), " nets: ", (end - start), "s");
}
```

### 2.3.7 GuideProcessor

* 设计思路
  为了让TA在分配线段的时候有更大的自由度，我们希望抽取的线段能更加灵活一点，所以选择在Pin的位置对Guide进行切割
  以下是内联区域的LocalRegion产生线段图示
  ![输入图片说明](https://images.gitee.com/uploads/images/2022/0530/193835_312ac088_7702195.png "屏幕截图.png")

以下是Guide抽线图示

![输入图片说明](https://images.gitee.com/uploads/images/2022/0525/171936_bc8f1de9_7702195.png "屏幕截图.png")

* 功能描述
  
  - 对GR的Guide进行处理
    - 按Pin的位置进行切割
    - 去重
* 主要流程图

<img src="https://images.gitee.com/uploads/images/2022/0531/161623_8e39d7a6_1004707.png" width="45%">

* 可调用接口

### 2.3.8 RegionManager

![输入图片说明](https://images.gitee.com/uploads/images/2022/0604/161854_7cd7ac4c_7702195.png "屏幕截图.png")

* 设计思路
  为了解决指定大小区域后周边金属例如Pin，block，Seg和区域内已有金属造成的DRC违例，我们会对区域进行膨胀，然后我们通过RM能快速搜索区域内的金属，这样就得到了区域内以及区域边界的金属
* 功能描述
  
  - 首先初始化用Rtree保存所有的Block和Pin作为静态数据
    - block采用DRC膨胀+融合
    - 需要的时候在拆分
  - 建立RModel，统一以RModel数据处理
  - 加入或者消除Wire或者Via的时候，转为RModel
  - 给定层和区域可以通过boost库快速获取相交的所有物体
* 主要流程图

<img src="https://images.gitee.com/uploads/images/2022/0604/192639_9b01e4ed_7702195.png" width="60%">

* 可调用接口

```cpp=
// 获得指定层layer和其上区域region内的矩形，包括pin/via/wire/blockage
  std::map<irt_int, std::vector<Rectangle<irt_int>>> getRectMapInRegion(irt_int layer_idx, Rectangle<irt_int> region);
  // 获得指定层layer和其上区域region内的矩形，只包括blockage和pin的shape
  std::map<irt_int, std::vector<Rectangle<irt_int>>> getBlockageAndPin(irt_int layer_idx, Rectangle<irt_int> region);
  bool addRecord(RMModel& rm_model);    // 通过rm_model向RM的rtree中添加信息
  bool delRecord(RMModel& rm_model);    // 通过rm_model向RM的rtree中删除信息
  bool getSolution(RMModel& rm_model, bool ignore_checking_self = false); // 返回合法性检查结果
```

### 2.3.9 TrackAssignment

* 设计思路
  我们已知每个Panel的Pin和Seg的信息，并且知道他们的所在线网，我们简单的可以利用贪心逐步试探，去寻找代价最小的Track，对所有线段进行分配，正常来说判断一个对象是否和其他对象重叠最简单的是1对N比较，然后利用boost的Rtree可以降低时间复杂度

![输入图片说明](https://images.gitee.com/uploads/images/2022/0604/160521_2d4710e6_7702195.png "屏幕截图.png")

* 功能描述
  
  - 遍历所有Net,判断是否为Local_net，如果是的话按照HV或者SR生成主干线段
  - 抽取Guide线段,如果一个区域包含多pin，生成局部local net主干线段
  - 上述线段存入对应Panel
  - 开始TA，首先进行ILP，如果ILP超时或者无解，采用贪心算法
  - 结果进行合并去重，写回NET
* 主要流程图
  <img src="https://images.gitee.com/uploads/images/2022/0604/192217_8019e95a_7702195.png " width="60%">
* 可调用接口

```cpp=
AssignTrackType ta_type = AssignTrackType::kGreddy;
TrackAssigner::getInst().assignTrack(net_list, ta_type);
```

### 2.3.10 RegionRouter

* 设计思路
  目前绕线解空间过大，运行时间过长，随着集成电路制造工艺进入7nm以下，数字芯片中标准单元数量已经达到亿数量级，EDA算法已经成为典型的数据密集型计算的典型代表。且在现有布线方法可接受的计算时间内，不一定能得到局部最优解，甚至有可能得到一个劣解。以上两点导致详细绕线的计算时间非常冗长，以小时计。为了减少后续求解规模，加入了区域绕线，先将线网在DRC代价尽量小的情况下连通起来，减少后续绕线规模

![输入图片说明](https://images.gitee.com/uploads/images/2022/0604/163556_81aef728_7702195.png "屏幕截图.png")

* 功能描述
  
  - 首先生成区域拓扑
    - 遍历Grid区域生成All Layer Router，从 `RRouterLayerList` 中获得拓扑数据存储的位置
    - 遍历Router中的每条subnet：
      - 获得Key Point
      - 根据Key Point，调用SR获得坐标间的拓扑关系
      - 斯坦纳点分配层信息
      - 为跨层的点生成Via
  - 从第二层开始,每两层开始绕线
    - 按区域遍历
      - 建立cost_map,RM初始化
      - 获取拓扑数据
      - 绕线
        - 根据当前布线资源，移动将不合法的拓扑点
        - Cost_map更新
        - 模式布线，A*
        - 如果不连通则强制绕线
    - 按区域检测DRC，是否拆线重布
      - 选择Cost的最大Net拆线
      - 反馈Cost给Cost_map
      - 重绕线
      - 迭代若干次后还是不行则按密度扩区域
* 主要流程图
  <img src = "https://images.gitee.com/uploads/images/2022/0604/192047_b6af9336_7702195.png" width="60%">
* 可调用接口

```cpp=
RegionRouter::getInst().buildRegionData(net_list);
RegionRouter::getInst().areaRouter();
```

### 2.3.11 SpaceRouter

* 设计思路
* 功能描述
  
  - 按照DRC选择Net目标
  - 扩区域
  - 建立三维图
  - 三维Astart
  - 同RegionRouter拆线迭代策略
* 主要流程图
* 可调用接口

## 2.4 评价指标

* 线长：所有连通线网的总线长
* 通孔数量：所有连通线网的总通孔数量
* DRC违例个数：设计规则违例个数，可细分为spacing、area和width等类型
* 时间：主程序运行的总时间
* 断路线网个数：布线失败的线网个数
* 短路线网个数：布线结果存在环路的线网个数
* 时序违例个数：存在setup，hold违例的线网个数
* 内存：运行的峰值内存

## 2.5 算法设计

### 2.5.1 资源分配的二次规划罚方法

为了能够得到合理的资源分配，将每个GCell的有限资源分配到对应的多个线网(net)下，并保证所有线网的需求不变。为此，我们将资源分配建模为式$(1)$。

$$
\min_{x} \sum_{g_i \in B_j} (\sum_{n_i \in N}x_{i,j}-r_i)^2 \\ s.t. \sum_{g_i \in B_j} x_{i,j} = d_j,\forall n_j \in N,
\tag{1}
$$

其中 $g_i \in B_j$ 表示第$i$个GCell, $n_j \in N$表示第$j$个线网，$B_j$是线网$n_j$的外接矩形. $x_{i,j}$是第$i$个GCell在第$j$个线网所分配的资源。随后再将其转换为标准的二次规划问题。

$$
\min_{x} \frac{1}{2}x^{T}Q x+p^{T}x \\ s.t. Ax=b.
\tag{2}
$$

式$(2)$中，$Q$是一个分块对角矩阵，表示$x$和GCells之间的关系。$p^{T}$是一个向量，用于存储每个GCell的资源量。$A$是一个对角矩阵，表示$x$和线网之间的关系。$b$是一个存储所有线网需求的向量。为了方便求解，我们通过罚函数法，将式$(2)$的有约束问题转换为无约束问题式$(3)$。

$$
\min_{x} ~\frac{1}{2}x^{T}Q x+p^{T}x + \frac{1}{2\mu}(Ax - b)^{2},
\tag{3}
$$

其中$\frac{1}{2\mu}$是罚参数。随后，我们将式$(3)$整理成式$(4)$。

$$
\min_{x} ~\frac{1}{2} x^{T} Q_G x+p^{T}_G x + \frac{1}{2\mu} (\frac{1}{2} x^{T} Q_N x+p^{T}_N x),
\tag{4}
$$

其中$Q_G$和$Q_N$分别是表示x与GCells和线网之间的关系。$p^{T}_G$和$p^{T}_N$分别表示GCell资源和线网需求。为方便迭代说明，我们将式$(4)$表达为函数$f(x,\mu)$：

$$
f(x,\mu) = \frac{1}{2} x^{T} (Q_G + \frac{1}{2\mu}Q_N) x + (p^{T}_G+\frac{1}{2\mu}p^{T}_N)x.
\tag{5}
$$

令$Q_{G,N}(\mu) = Q_G + \frac{1}{2\mu} Q_N$和$p_{G,N}(\mu) = p_G^{T} + \frac{1}{2\mu} p_N^{T}$，我们将$f(x,\mu)$简化为：

$$
f(x,\mu) = \frac{1}{2} x^{T} Q_{G,N}(\mu)x + p_{G,N}(\mu)x
\tag{6}
$$

对于$f(x,\mu)$，我们使用梯度下降方法进行迭代，迭代的过程如下：
<img src="https://images.gitee.com/uploads/images/2022/0602/210735_b6e852a5_1004707.png"  width="80%"/>

### 2.5.2 Via aware A\*路径搜索算法

传统A\*路径搜索算法是通过$f(x)=g(x)+h(x)$函数来计算每个节点的代价，其中$g(x)$是起点到当前点的已知代价，$h(x)$是当前点到终点的预估代价。当预估代价小于等于实际代价时，A\*算法的结果将会是最优的。在物理设计阶段，布线只会是横平竖直的，所以以曼哈顿距离来计算得到预估距离。为了能够达到更少的通孔数量，iRT通过L型预布线来预估通孔数量。流程图如下所示：

![输入图片说明](https://images.gitee.com/uploads/images/2022/0602/211243_ecf7376d_1004707.png#pic_center "Snipaste_2022-05-31_16-18-22.png")

### 2.5.3 pin access算法设计

> 贪心算法：

```
Input: Panel panel,  optimal PAPoint vector opt_pa_point_List

get PAPort vector pa_port_list by panel 
sort pa_port by non-increasing of pa'number
Foreach pa_port in pa_port_list:
  opt_pa_point;
  min_conflict_cost = MAX_value;
  Foreach pa_point in pa_point_list:
curr_conflict_cost = 0;
curr_conflict_cost = calConflictWithPaOfOptPaPointList();
if (min_conflict_cost > curr_conflict_cost) then
  min_conflict_cost = curr_conflict_cost;
  opt_pa_point = pa_point;
end if
  end foreach
  sort pa_point_list by ascending order of total-cost
  insert opt_pa_point insert opt_pa_point
end foreach
```

### 2.5.4 GuideProcessor算法设计

生成线段，判断是否为Local Net以及Net是否存在内联Local Region（有多Pin在同一个Region）

```cpp=
InPut:Net set N（s)，RoutingLayerTrack set T(s)
Foreach net In N(s)
    if(LocalNet()){
        genIntraGcellNet(HV or SR,net);
    }else{
        //内联区域产生Local Seg
       genIntraGcellNet（HV or SR,net)
       //guide 抽线
       genIntraGcellNet（net)
    }
    duplicateSegList（net)
    //存储相邻关系
    init_net_connected_relationship(ta_net);
End Foreach
```

### 2.5.5 TA算法设计

传统的TrackAssignMent算法是采用下面这样的贪心算法，我们在使用的时候发现，需要考虑额外考虑Pa和Pin的Cost来避免，上层的线段直接将其他线网的PA点给遮挡住
![输入图片说明](https://images.gitee.com/uploads/images/2022/0604/154645_f6b74704_7702195.png "屏幕截图.png")
AssignTrack的时候采用Greedy

```cpp=
贪心：
  Input：Panel p,seg set S(p),and track set T(p)
  Sort S(p) based on their lengths in a non-increasing ordere
  Foreach seg in S(p) traversed by their sorted order
    minCost = +00
    Foreach track t in T(p)
      wlCost = calculateWirelengthCost(seg,t)
            paCost = calculatePaCost(seg,t)
      otherPaCost = calculateOtherPaCost(seg,t)
      overlapCost = calculateOverlapCost(seg,t)
      blockCost = calculateBlocakgeCost(seg,t)
      Cost = wlCost*α +paCost  *j + otherPaCost * m + overlapCost*β+ blockCost*k
      If(cost < minCost) then
        minCost = cost
              minCostTrack = t
            End if
          End foreach
          Assign seg to minCostTrack
  End foreach
  函数解释
  calculateWirelengthCost(seg,t)暂时可以不加这个cost
  calculatePaWireLengthCost(seg,t)
      seg想和同类型的pa近，算的是seg终点和pa点的二维距离，这部分数据需要预处理一下
  calculateOtherPaCost(seg,t)
      如果seg的矩形和panel的pa_tree矩形存在相交且不是本类型，增加cost,如果是本类型的减少cost,cost算的是重叠长度
  calculateOverlapCost(seg,t)
      如果seg的矩形和panel的seg_tree矩形存在相交且不是本类型，增加cost
  calculateBlocakgeCost(seg,t)
      如果seg的矩形和panel的block_tree矩形存在相交，增加cost，算的是重叠长度大小
  目前α为0.5 ，j为1，m为 50 ，β为100，k为10000
```

### 2.5.6 RegionRouter算法设计

由于读取Guide的时候，会出现跨层的线段，为了让跨层的线段能在区域绕线这个阶段连接起来，我们通过对每个区域的所有层金属构建一个全局的TOPO，然后检查是否存在跨层的线段，如果有则中间层留点进行连接。其次，我们想利用SR+动态TOPO改变ToPo解决冗余绕线的问题。
![输入图片说明](https://images.gitee.com/uploads/images/2022/0604/163809_16646c6d_7702195.png "屏幕截图.png")
然后对每个区域进行绕线，不能绕线的采取强制绕线，所有层结束后，依次每层开始区域拆线重布（扰动），整体框架如下
![输入图片说明](https://images.gitee.com/uploads/images/2022/0604/164026_be074b36_7702195.png "屏幕截图.png")

## 2.6 数据结构设计

# 3. 接口设计

## 3.1 外部接口

```cpp=
//////***standalone*** : 内部启动iDB ///////
irt::RT* rt_standalone = new irt::RT(rt_config_file_path);
rt_standalone->run();
delete rt_standalone;
//////***standalone***///////

//////***platform*** : 外部启动iDB ///////
PCL::iDB::IdbBuilder* idb_builder = nullptr;
irt::RT* rt_platform = new irt::RT(rt_config_file_path, idb_builder);
rt_platform->run();
delete rt_platform;
  //////***platform***///////
```

# 4. DEF输出

![输入图片说明](https://images.gitee.com/uploads/images/2022/0525/170713_cc85bc74_7702195.png "屏幕截图.png")

# 5. TO BE DONE

## 5.1 疑难问题

> *描述重点难点问题* ；
> 
> *说明在开发过程中遇到的问题，以及解决方法。例如：方法的选择、参数的处理、需要说明的其他具体问题。如果有不能正常工作的模块，说明具体情况，猜测可能的原因。*

## 5.2 待研究

> *待研究问题；*

